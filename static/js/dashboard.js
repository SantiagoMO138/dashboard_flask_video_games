//const csvUrl = "https://raw.githubusercontent.com/rudyluis/DashboardJS/refs/heads/main/video_games_sales.csv";
let allData = [];
let filteredData = [];


$(document).ready(function () {

    $('#filterPlataforma, #filterGenero, #filterAnio, #filterEditor').select2({
        placeholder: "Seleccionar...",
        allowClear: true,
        width: '100%',
        closeOnSelect: false,
        minimumResultsForSearch: 0,
        tags: false
    }).on('select2:select', function () {

        $(this).data('select2').$dropdown.find('.select2-search__field').focus();
    });

    // Prevención de reapertura al limpiar con la "X"
    $('#filterPlataforma, #filterGenero, #filterAnio, #filterEditor')
        .on('select2:unselecting', function (e) {
            $(this).data('prevent-open', true);
        })
        .on('select2:opening', function (e) {
            if ($(this).data('prevent-open')) {
                e.preventDefault();  // Evita que se abra
                $(this).removeData('prevent-open');
            }
        });

    /*$.ajax({
        url: csvUrl,
        dataType: 'text',
        success: function (data) {
            parsed = Papa.parse(data, { header: true });
            allData = parsed.data.filter(d => d.Name && d.Global_Sales && !isNaN(parseFloat(d.Global_Sales)));
            filteredData = allData;
            console.log(allData);
            popularFiltros();
            actualizarStatsCards();
            aplicarFiltrosYGraficos();
        }
    });*/
    $.ajax({
        url: "/api/video_games",
        method: "GET",
        dataType: "json",
        success: function (data) {
            console.log("Datos recibidos:", data);
           
            allData = data;
            filteredData = allData;
            console.log(allData);
            popularFiltros();
            actualizarStatsCards();
            aplicarFiltrosYGraficos();

        },
        error: function (xhr, status, error) {
            console.error("Error al cargar los datos:", error);
        }
    });

    $('#filterPlataforma, #filterGenero, #filterAnio, #filterEditor').on('change', function () {
        //popularFiltros()
        aplicarFiltrosYGraficos();
    });

    $('#searchTitle').on('input', function () {
        aplicarFiltrosYGraficos();
    });

    $('.period-btn').on('click', function () {
        $('.period-btn').removeClass('active');
        $(this).addClass('active');
        renderGraficos(filteredData);
    });
});
/*
function popularFiltros() {
    const plataformaSel = $('#filterPlataforma').val() || [];
    const generoSel = $('#filterGenero').val() || [];
    const anioSel = $('#filterAnio').val() || [];
    const editorSel = $('#filterEditor').val() || [];

    const unique = (arr, key) => [...new Set(arr.map(d => d[key]).filter(Boolean))].sort();

    const actualizarCombo = (id, valores, valoresActuales) => {
        const select = $(id);
        select.empty();
        valores.forEach(v => select.append(`<option value="${v}">${v}</option>`));
        select.val(valoresActuales.length > 0 ? valoresActuales : null);
        select.trigger('change');
    };

    actualizarCombo('#filterPlataforma', unique(plataformaSel.length > 0 ? allData.filter(d =>
        (generoSel.length === 0 || generoSel.includes(d.Genre)) &&
        (anioSel.length === 0 || anioSel.includes(d.Year)) &&
        (editorSel.length === 0 || editorSel.includes(d.Publisher))
    ) : allData, 'Platform'), plataformaSel);

    actualizarCombo('#filterGenero', unique(generoSel.length > 0 ? allData.filter(d =>
        (plataformaSel.length === 0 || plataformaSel.includes(d.Platform)) &&
        (anioSel.length === 0 || anioSel.includes(d.Year)) &&
        (editorSel.length === 0 || editorSel.includes(d.Publisher))
    ) : allData, 'Genre'), generoSel);

    actualizarCombo('#filterAnio', unique(anioSel.length > 0 ? allData.filter(d =>
        (plataformaSel.length === 0 || plataformaSel.includes(d.Platform)) &&
        (generoSel.length === 0 || generoSel.includes(d.Genre)) &&
        (editorSel.length === 0 || editorSel.includes(d.Publisher))
    ) : allData, 'Year'), anioSel);

    actualizarCombo('#filterEditor', unique(editorSel.length > 0 ? allData.filter(d =>
        (plataformaSel.length === 0 || plataformaSel.includes(d.Platform)) &&
        (generoSel.length === 0 || generoSel.includes(d.Genre)) &&
        (anioSel.length === 0 || anioSel.includes(d.Year))
    ) : allData, 'Publisher'), editorSel);
}

*/
function popularFiltros() {
    const params = {
        plataforma: $('#filterPlataforma').val() || [],
        genero: $('#filterGenero').val() || [],
        anio: $('#filterAnio').val() || [],
        editor: $('#filterEditor').val() || []
    };

    $.ajax({
        url: '/api/filtros',
        method: 'GET',
        data: params,
        traditional: true,  // importante para enviar listas en query string
        success: function (res) {
            actualizarCombo('#filterPlataforma', res.plataformas, params.plataforma);
            actualizarCombo('#filterGenero', res.generos, params.genero);
            actualizarCombo('#filterAnio', res.anios, params.anio);
            actualizarCombo('#filterEditor', res.editores, params.editor);
        },
        error: function (err) {
            console.error("Error al cargar filtros:", err);
        }
    });
}

function actualizarCombo(id, valores, valoresActuales) {
    const select = $(id);
    select.empty();
    valores.forEach(v => select.append(`<option value="${v}">${v}</option>`));
    select.val(valoresActuales);
    select.trigger('change.select2'); // si usas select2
}



function actualizarStatsCards() {
    const totalSales = filteredData.reduce((sum, d) => sum + parseFloat(d.Global_Sales || 0), 0);
    const platformSales = {};
    const genreSales = {};
    const yearSales = {};

    filteredData.forEach(d => {
        platformSales[d.Platform] = (platformSales[d.Platform] || 0) + parseFloat(d.Global_Sales || 0);
        genreSales[d.Genre] = (genreSales[d.Genre] || 0) + parseFloat(d.Global_Sales || 0);
        yearSales[d.Year] = (yearSales[d.Year] || 0) + parseFloat(d.Global_Sales || 0);
    });

    const leadingPlatform = Object.keys(platformSales).reduce((a, b) => platformSales[a] > platformSales[b] ? a : b, 'N/A');
    const popularGenre = Object.keys(genreSales).reduce((a, b) => genreSales[a] > genreSales[b] ? a : b, 'N/A');
    const topYear = Object.keys(yearSales).reduce((a, b) => yearSales[a] > yearSales[b] ? a : b, 'N/A');

    $('#totalSales').text(`${(totalSales).toFixed(2)}M`);
    $('#totalSalesVar').text(totalSales > 0 ? '↑ Total Ventas' : '—').addClass(totalSales > 0 ? 'positive' : '');
    $('#leadingPlatform').text(leadingPlatform);
    $('#popularGenre').text(popularGenre);
    $('#topYear').text(topYear);
    $('#topYearVar').text('Año Top');
}

function aplicarFiltrosYGraficos() {
    const plataforma = $('#filterPlataforma').val() || [];
    const genero = $('#filterGenero').val() || [];
    const anio = $('#filterAnio').val() || [];
    const editor = $('#filterEditor').val() || [];
    const search = $('#searchTitle').val().toLowerCase();

    filteredData = allData.filter(d =>
        (plataforma.length === 0 || plataforma.includes(d.Platform)) &&
        (genero.length === 0 || genero.includes(d.Genre)) &&
        (anio.length === 0 || anio.includes(d.Year)) &&
        (editor.length === 0 || editor.includes(d.Publisher)) &&
        (!search || d.Name.toLowerCase().includes(search))
    );

    
    cargarTabla(filteredData);
    actualizarStatsCards();
    renderGraficos(filteredData);
}

function cargarTabla(data) {
    const tabla = $('#tablaDatos').DataTable();
    tabla.clear().destroy();

    const cuerpo = data.map(d => [
        d.Name,
        d.Platform,
        d.Year,
        d.Genre,
        d.Publisher,
        parseFloat(d.NA_Sales).toFixed(2),
        parseFloat(d.EU_Sales).toFixed(2),
        parseFloat(d.JP_Sales).toFixed(2),
        parseFloat(d.Other_Sales).toFixed(2),
        parseFloat(d.Global_Sales).toFixed(2)
    ]);

    $('#tablaDatos').DataTable({
        data: cuerpo,
        columns: [
            { title: "Título" },
            { title: "Plataforma" },
            { title: "Año" },
            { title: "Género" },
            { title: "Editor" },
            { title: "Ventas NA", className: "text-end" },
            { title: "Ventas EU", className: "text-end" },
            { title: "Ventas JP", className: "text-end" },
            { title: "Ventas Otros", className: "text-end" },
            { title: "Ventas Globales", className: "text-end" }
        ],
        responsive: true
    });
}
function renderGraficos(data) {
    
    ['ventasPorPlataforma', 'ventasPorGenero', 'ventasPorAnio', 'graficoRadar', 'ventasPorRegion', 'ventasPorEditor', 'ventasTopTitulos', 'ventasGeneroPorAnio', 'ventasPorTituloAnio', 'ventasPorEditorRegion'].forEach(id => {
        Chart.getChart(id)?.destroy();
    });

    
    const ventasPlataforma = {}, ventasGenero = {}, ventasAnio = {}, radarData = {}, ventasRegion = {}, ventasEditor = {}, ventasTitulos = [], generoPorAnio = {}, ventasTituloAnio = [], ventasEditorRegion = {};

    
    data.forEach(d => {
        const plataforma = d.Platform;
        const genero = d.Genre;
        const anio = d.Year;
        const editor = d.Publisher;
        const globalSales = parseFloat(d.Global_Sales || 0);
        const naSales = parseFloat(d.NA_Sales || 0);
        const euSales = parseFloat(d.EU_Sales || 0);
        const jpSales = parseFloat(d.JP_Sales || 0);
        const otherSales = parseFloat(d.Other_Sales || 0);
        const anioNum = parseInt(d.Year) || 0;

        
        ventasPlataforma[plataforma] = (ventasPlataforma[plataforma] || 0) + globalSales;
        ventasGenero[genero] = (ventasGenero[genero] || 0) + globalSales;
        ventasAnio[anio] = (ventasAnio[anio] || 0) + globalSales;
        radarData[genero] = (radarData[genero] || 0) + globalSales;

        
        if (!ventasRegion[plataforma]) {
            ventasRegion[plataforma] = { NA: 0, EU: 0, JP: 0, Other: 0 };
        }
        ventasRegion[plataforma].NA += naSales;
        ventasRegion[plataforma].EU += euSales;
        ventasRegion[plataforma].JP += jpSales;
        ventasRegion[plataforma].Other += otherSales;

        
        ventasEditor[editor] = (ventasEditor[editor] || 0) + globalSales;
        ventasTitulos.push({ name: d.Name, sales: globalSales });

        if (!generoPorAnio[anio]) {
            generoPorAnio[anio] = {};
        }
        generoPorAnio[anio][genero] = (generoPorAnio[anio][genero] || 0) + globalSales;
        ventasTituloAnio.push({ name: d.Name, year: anioNum, sales: globalSales });

        
        if (!ventasEditorRegion[editor]) {
            ventasEditorRegion[editor] = { NA: 0, EU: 0, JP: 0, Other: 0 };
        }
        ventasEditorRegion[editor].NA += naSales;
        ventasEditorRegion[editor].EU += euSales;
        ventasEditorRegion[editor].JP += jpSales;
        ventasEditorRegion[editor].Other += otherSales;
    });

    // Chart 1: Platform Sales (Bar)
    new Chart(document.getElementById('ventasPorPlataforma'), {
        type: 'bar',
        data: {
            labels: Object.keys(ventasPlataforma),
            datasets: [{
                label: 'Ventas Globales por Plataforma',
                data: Object.values(ventasPlataforma),
                backgroundColor: '#6A5ACD'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Ventas Globales por Plataforma',
                    font: { size: 18 }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let value = context.raw || 0;
                            return `${context.dataset.label}: ${value.toLocaleString()}M`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Ventas (Millones)'
                    }
                }
            }
        }
    });

    // Chart 2: Genre Sales (Pie)
    new Chart(document.getElementById('ventasPorGenero'), {
        type: 'pie',
        data: {
            labels: Object.keys(ventasGenero),
            datasets: [{
                label: 'Ventas por Género',
                data: Object.values(ventasGenero),
                backgroundColor: [
                    '#6A5ACD', '#FFA500', '#4682B4', '#FF6384', '#FFCE56',
                    '#9966FF', '#4BC0C0', '#C9CBCF', '#8E44AD', '#F39C12'
                ],
                borderColor: '#FFFFFF',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribución de Ventas por Género',
                    font: { size: 18 }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.label || '';
                            let value = context.raw || 0;
                            let total = context.dataset.data.reduce((a, b) => a + b, 0);
                            let percentage = total > 0 ? ((value / total) * 100).toFixed(2) : 0;
                            return `${label}: ${value.toLocaleString()}M (${percentage}%)`;
                        }
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 20, font: { size: 12 } }
                }
            }
        }
    });

    // Apply period filter for yearly charts
    const period = $('.period-btn.active').data('period');
    let aniosFiltrados = Object.keys(ventasAnio).sort();
    const currentYear = Math.max(...aniosFiltrados.filter(y => !isNaN(y)));
    if (period === 'last5') {
        aniosFiltrados = aniosFiltrados.filter(y => parseInt(y) >= currentYear - 4);
    } else if (period === 'last') {
        aniosFiltrados = aniosFiltrados.filter(y => parseInt(y) === currentYear);
    }

    // Chart 3: Yearly Sales (Line)
    new Chart(document.getElementById('ventasPorAnio'), {
        type: 'line',
        data: {
            labels: aniosFiltrados,
            datasets: [{
                label: 'Ventas Globales por Año',
                data: aniosFiltrados.map(a => ventasAnio[a] || 0),
                fill: false,
                borderColor: '#FFA500',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Ventas Globales por Año',
                    font: { size: 18 }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let value = context.raw || 0;
                            return `${context.dataset.label}: ${value.toLocaleString()}M`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Ventas (Millones)'
                    }
                }
            }
        }
    });

    // Chart 4: Genre Sales (Radar)
    new Chart(document.getElementById('graficoRadar'), {
        type: 'radar',
        data: {
            labels: Object.keys(radarData),
            datasets: [{
                label: 'Ventas por Género',
                data: Object.values(radarData),
                backgroundColor: 'rgba(106, 90, 205, 0.5)',
                borderColor: '#6A5ACD',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Ventas por Género',
                    font: { size: 18 }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let value = context.raw || 0;
                            return `${context.dataset.label}: ${value.toLocaleString()}M`;
                        }
                    }
                }
            }
        }
    });

    // Chart 5: Regional Sales by Platform (Stacked Bar)
    const plataformas = Object.keys(ventasRegion);
    new Chart(document.getElementById('ventasPorRegion'), {
        type: 'bar',
        data: {
            labels: plataformas,
            datasets: [
                {
                    label: 'Ventas NA',
                    data: plataformas.map(p => ventasRegion[p].NA),
                    backgroundColor: '#6A5ACD'
                },
                {
                    label: 'Ventas EU',
                    data: plataformas.map(p => ventasRegion[p].EU),
                    backgroundColor: '#FFA500'
                },
                {
                    label: 'Ventas JP',
                    data: plataformas.map(p => ventasRegion[p].JP),
                    backgroundColor: '#4682B4'
                },
                {
                    label: 'Ventas Otros',
                    data: plataformas.map(p => ventasRegion[p].Other),
                    backgroundColor: '#FF6384'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Ventas por Región y Plataforma',
                    font: { size: 18 }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let value = context.raw || 0;
                            return `${context.dataset.label}: ${value.toLocaleString()}M`;
                        }
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: { font: { size: 12 } }
                }
            },
            scales: {
                x: { stacked: true },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Ventas (Millones)'
                    }
                }
            }
        }
    });

    // Chart 6: Top Publishers (Horizontal Bar)
    const topEditores = Object.entries(ventasEditor)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    new Chart(document.getElementById('ventasPorEditor'), {
        type: 'bar',
        data: {
            labels: topEditores.map(e => e[0]),
            datasets: [{
                label: 'Ventas Globales por Editor',
                data: topEditores.map(e => e[1]),
                backgroundColor: '#FFA500'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Top 10 Editores por Ventas',
                    font: { size: 18 }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let value = context.raw || 0;
                            return `${context.dataset.label}: ${value.toLocaleString()}M`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Ventas (Millones)'
                    }
                }
            }
        }
    });

    // Chart 7: Top Titles (Bar)
    const topTitulos = ventasTitulos
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 10);
    new Chart(document.getElementById('ventasTopTitulos'), {
        type: 'bar',
        data: {
            labels: topTitulos.map(t => t.name),
            datasets: [{
                label: 'Ventas Globales por Título',
                data: topTitulos.map(t => t.sales),
                backgroundColor: '#4682B4'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Top 10 Títulos por Ventas',
                    font: { size: 18 }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let value = context.raw || 0;
                            return `${context.dataset.label}: ${value.toLocaleString()}M`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Ventas (Millones)'
                    }
                },
                x: {
                    ticks: {
                        autoSkip: false,
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });

    // Chart 8: Genre Sales by Year (Stacked Area)
    const generos = [...new Set(data.map(d => d.Genre))].sort();
    const anios = aniosFiltrados;
    new Chart(document.getElementById('ventasGeneroPorAnio'), {
        type: 'line',
        data: {
            labels: anios,
            datasets: generos.map((genero, i) => ({
                label: genero,
                data: anios.map(a => generoPorAnio[a]?.[genero] || 0),
                fill: true,
                backgroundColor: [
                    '#6A5ACD', '#FFA500', '#4682B4', '#FF6384', '#FFCE56',
                    '#9966FF', '#4BC0C0', '#C9CBCF', '#8E44AD', '#F39C12'
                ][i % 10] + '80', // 50% opacity
                borderColor: [
                    '#6A5ACD', '#FFA500', '#4682B4', '#FF6384', '#FFCE56',
                    '#9966FF', '#4BC0C0', '#C9CBCF', '#8E44AD', '#F39C12'
                ][i % 10],
                borderWidth: 1
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Ventas por Género a lo Largo del Tiempo',
                    font: { size: 18 }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let value = context.raw || 0;
                            return `${context.dataset.label}: ${value.toLocaleString()}M`;
                        }
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: { font: { size: 12 } }
                }
            },
            scales: {
                x: { stacked: true },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Ventas (Millones)'
                    }
                }
            }
        }
    });

    // Chart 9: Top Titles by Year (Bubble)
    const topTitulosAnio = ventasTituloAnio
        .filter(t => t.year > 0) // Exclude invalid years
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 10);
    new Chart(document.getElementById('ventasPorTituloAnio'), {
        type: 'bubble',
        data: {
            datasets: [{
                label: 'Top 10 Títulos por Año',
                data: topTitulosAnio.map(t => ({
                    x: t.year,
                    y: t.sales,
                    r: Math.min(t.sales * 5, 30), // Scale radius, cap at 30
                    name: t.name
                })),
                backgroundColor: '#FFA500',
                borderColor: '#FFFFFF',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Top 10 Títulos por Año de Lanzamiento',
                    font: { size: 18 }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const data = context.raw;
                            return `${data.name}: ${data.y.toLocaleString()}M (Año: ${data.x})`;
                        lihg
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: { font: { size: 12 } }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Año de Lanzamiento'
                    },
                    min: Math.min(...topTitulosAnio.map(t => t.year)) - 1,
                    max: Math.max(...topTitulosAnio.map(t => t.year)) + 1
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Ventas (Millones)'
                    }
                }
            }
        }
    }
    });

// Chart 10: Editor Sales by Region (Polar Area)
const topEditoresRegion = Object.entries(ventasEditorRegion)
    .sort((a, b) => (b[1].NA + b[1].EU + b[1].JP + b[1].Other) - (a[1].NA + a[1].EU + a[1].JP + a[1].Other))
    .slice(0, 5);
const regiones = ['NA', 'EU', 'JP', 'Other'];
const publisherNames = topEditoresRegion.map(e => e[0]);
new Chart(document.getElementById('ventasPorEditorRegion'), {
    type: 'polarArea',
    data: {
        labels: publisherNames,
        datasets: regiones.map((region, i) => ({
            label: region,
            data: topEditoresRegion.map(e => e[1][region]),
            backgroundColor: [
                '#6A5ACD80', // NA: Purple, 50% opacity
                '#FFA50080', // EU: Orange, 50% opacity
                '#4682B480', // JP: Blue, 50% opacity
                '#FF638480'  // Other: Red, 50% opacity
            ][i],
            borderColor: '#FFFFFF',
            borderWidth: 1
        }))
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: 'Ventas de Top 5 Editores por Región',
                font: { size: 18 }
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let value = context.raw || 0;
                        let publisher = context.label;
                        let region = context.dataset.label;
                        return `${publisher} (${region}): ${value.toLocaleString()}M`;
                    }
                }
            },
            legend: {
                position: 'bottom',
                labels: { font: { size: 12 } }
            }
        }
    }
});
}

$('#toggleTheme').on('click', function () {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-bs-theme') === 'dark';
    html.setAttribute('data-bs-theme', isDark ? 'light' : 'dark');
    this.textContent = isDark ? 'Modo Claro 🌞' : 'Modo Oscuro 🌙';
});

    window.addEventListener('load', function () {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = 'none';
        }
    });

