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

let countries = [], countries_stat = [], colors = [];

const socket = io();

socket.on('connect', function() {
    console.log('Connected to server!');
})

socket.on('infoUpdate', function(data) {
    let total = 0;
    let keys = Object.keys(data.deviceStats)

    //Update total num and individual parts
    keys.forEach((item) => {
        total += data.deviceStats[item].count;
        $(`#${item}`).text(parseInt(data.deviceStats[item].count));
    })

    //Apply data to chart
    
    // countries = Object.keys(data.countryStats);
    // countries_stat = countries.map((item) => {
    //     return data.countryStats[item];
    // });
    // colors = countries.map((item) => {
    //     return randomColor({format: 'rgba', alpha: 0.6, seed: item});
    // })

    // chart.data.datasets[0] = {data: countries_stat, backgroundColor: colors};
    // chart.data.labels = countries;
    // chart.update({duration: 0});

    //Apply total number
    $('#totalVuln').text(total);

    //Set global object
    stats = data;
})

$(function(){
    console.log('Page loaded!');

    let keys = Object.keys(stats.deviceStats)
    keys.forEach((item) => {
        let html = `<div class="column col-3 col-mx-auto card text-center"><h4 class="card-header animated fadeIn">${stats.deviceStats[item].title}</h5><h1 class="card-body animated fadeIn odometer" id="${item}">${parseInt(stats.deviceStats[item].count)}</h1></div>`
        $('#restOfDevices').append(html);
    })

    // chart = new Chart('vulnChart', {
    //     type: 'pie',
    //     data: {
    //         labels: ["Red"],
    //         datasets: [{
    //             label: 'Vulnerable Countries',
    //             data: [12],
    //             borderWidth: 1
    //         }]
    //     },
    //     options: {
    //         responsive: true,
    //         animation: {
    //             duration: 250
    //         }
    //     }
    // });

})