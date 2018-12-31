//Config
const config = require('./config.json');

//Generic modules
const path = require('path');
const chalk = require('chalk');

//Express and Socket.io
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
http.listen(config.HTTP_PORT, function(){
  console.log(chalk.green(`Webserver started on port ${config.HTTP_PORT}`));
});

//Modules for express
const helmet = require('helmet');
const morgan = require('morgan');
app.use(helmet());
app.use(morgan('short'));


//Serve files
app.use('/', express.static(path.resolve(__dirname, './web')));

//Socket.io
io.on('connection', function (socket) {
    console.log(chalk.green('Someone connected to socket!'));
});

//Hyperquest to stream json
const hyperquest = require('hyperquest');
const ndjson = require('ndjson');

//Global variables keeping count of total vulnerable devices
let stats = {
    deviceStats: {
        jplPrinters: {
            title: "Open JetDirect printers",
            count: 0
        },
        lpdPrinters: {
            title: "Open LPD printers",
            count: 0
        },
        cupsPrinters: {
            title: "Open CUPS printers",
            count: 0
        },
        openPrinters: {
            title: "Open printers (total)",
            count: 0
        },
        openWebcams: {
            title: "Open webcams (total)",
            count: 0
        },
        expiredSSLCerts: {
            title: "HTTPS Servers with expired certs",
            count: 0
        },
        openSMBServers: {
            title: "SMB servers with no authentication",
            count: 0
        },
        openVNCServers: {
            title: "VNC servers with no authentication",
            count: 0
        },
        openRDPServers: {
            title: "RDP servers with no authentication",
            count: 0
        },
        openUPnPServers: {
            title: "Open UPnP servers",
            count: 0
        },
        openChargen: {
            title: "Open Chargen servers",
            count: 0
        },
        openTelnet: {
            title: "Open Telnet servers",
            count: 0
        },
        openEcho: {
            title: "Open echo servers",
            count: 0
        },
        openMQTT: {
            title: "Open MQTT streams (IoT)",
            count: 0
        },
        vulnerableDevices: {
            title: "Servers/Devices with general vulnerabilites",
            count: 0
        }
    },
    countryStats: {

    }
}

//Listen to the shodan streaming API
hyperquest(`https://stream.shodan.io/shodan/banners?key=${config.shodan.API_KEY}`)
    .pipe(ndjson.parse())
    .on('data', (item) => {
        //Alright, prepare yourself for a crapload of if statements and regex
        
        //A boolean to check if the device was vulnerable in any way
        let wasVulnerable = false;

        //Printers first!
        if (item.port === 9100) {
            if (/jpl/ig.test(item.data)) {
                stats.deviceStats.jplPrinters.count++;
                stats.deviceStats.openPrinters.count++;
                wasVulnerable = true;
            }
        } else if (item.port === 515) {
            if (/lpd/ig.test(item.data)) {
                stats.deviceStats.lpdPrinters.count++;
                stats.deviceStats.openPrinters.count++;
                wasVulnerable = true;
            }
        } else if (item.port === 631) {
            if (/cups/ig.test(item.data)) {
                stats.deviceStats.cupsPrinters.count++;
                stats.deviceStats.openPrinters.count++;
                wasVulnerable = true;
            }
        }

        //Open webcams (we don't check for 200 OK because bruteforce applies)
        if (/HTTP\/[1-9]\.[1-9]/ig.test(item.data)) {
            //Yawcam is up first
            if (/yawcam/ig.test(item.data)) {
                stats.deviceStats.openWebcams.count++;
                wasVulnerable = true;
            } else if (/webcamxp/ig.test(item.data)) {
                stats.deviceStats.openWebcams.count++;
                wasVulnerable = true;
            } else if (/netcam/ig.test(item.data)) {
                stats.deviceStats.openWebcams.count++;
                wasVulnerable = true;
            } else if (/linux/ig.test(item.data) && /upnp/ig.test(item.data) && /avtech/ig.test(item.data)) {
                stats.deviceStats.openWebcams.count++;
                wasVulnerable = true;
            }
        } else if (/RTSP\/[1-9]\.[1-9]/ig.test(item.data)) {
            stats.deviceStats.openWebcams.count++;
            wasVulnerable = true;
        }

        //Check expired certs
        if (item.ssl) {
            if (item.ssl.cert) {
                if (item.ssl.cert.expired) {
                    stats.deviceStats.expiredSSLCerts.count++;
                    wasVulnerable = true;
                }
            }
        }


        //Check open SMB and VNC
        if (/authentication\: disabled/ig.test(item.data)) {
            if (item.port === 445) {
                stats.deviceStats.openSMBServers.count++;
                wasVulnerable = true;
            } else if (/RFB/ig.test(item.data)) {
                stats.deviceStats.openVNCServers.count++;
                wasVulnerable = true;
            }
        }

        //Open RDP
        if (item.port === 3389) {
            if (item.opts.screenshot) { //Shodan has a screenshot
                stats.deviceStats.openRDPServers.count++;
                wasVulnerable = true;
            }
        }

        //Open UPnP
        if (item.port === 1900 && /upnp/ig.test(item.data)) {
            stats.deviceStats.openUPnPServers.count++;
            wasVulnerable = true;
        }

        //Open telnet servers (not ssh)
        if (item.port === 23 && !(/ssh/ig.test(item.data))) {
            stats.deviceStats.openTelnet.count++;
            wasVulnerable = true;
        }

        //Chargen servers
        if (item.port === 19 && /CDEFGHIJKLMNO/ig.test(item.data)) {
            stats.deviceStats.openChargen.count++;
            wasVulnerable = true;
        }

        //Echo servers
        if (item.port === 7) {
            stats.deviceStats.openEcho.count++;
            wasVulnerable = true;
        }

        //Open MQTT streams
        if (/MQTT Connection Code\: 0/ig.test(item.data)) {
            stats.deviceStats.openMQTT.count++;
            wasVulnerable = true;
        }

        //General vulnerabilities
        if (item.vulns || item.opts.vulns) {
            stats.deviceStats.vulnerableDevices.count++;
            wasVulnerable = true;
        }

        //If the device was vulnerable, we have to increment the vulnerable countries statistics
        if (wasVulnerable) {
            if (stats.countryStats[item.location.country_name]) {
                stats.countryStats[item.location.country_name]++;
            } else {
                stats.countryStats[item.location.country_name] = 1;
            }

            io.emit('infoUpdate', stats);
        }
    })