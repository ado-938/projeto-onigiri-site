const mainElement = document.querySelector('main');
let dados = [];
const navigationHistory = [];

async function fetchData() {
    if (dados.length > 0) return dados;
    try {
        const response = await fetch('data.json');
        dados = await response.json();
        return dados;
    } catch (error) {
        console.error('Erro ao buscar os dados:', error);
        mainElement.innerHTML = '<p class="error">Não foi possível carregar os dados dos sistemas. Tente recarregar a página.</p>';
        return [];
    }
}

function getBaseSystemName(itemName) {
    if (itemName.toLowerCase().includes('feiticeiros & maldições') || itemName.toLowerCase().includes('f&m')) {
        return 'Feiticeiros & Maldições';
    }
    if (itemName.toLowerCase().includes('shinigamis & hollows')) {
        return 'Shinigamis & Hollows';
    }
    if (itemName.toLowerCase().includes('noites em tokyo')) {
        return 'Noites em Tokyo';
    }
    return 'Outros';
}

function getSystemImage(baseSystemName) {
    const imageName = baseSystemName.toLowerCase().replace(/ & /g, '-e-').replace(/ /g, '-') + '.jpg';
    return `images/${imageName}`;
}

function groupData(data) {
    const systems = {};

    data.forEach(item => {
        const baseName = getBaseSystemName(item.nome);
        if (!systems[baseName]) {
            systems[baseName] = {
                versions: [],
                supplements: [],
                image: getSystemImage(baseName)
            };
        }

        if (item.type === 'sistema') {
            systems[baseName].versions.push(item);
        } else if (item.type === 'suplemento') {
            systems[baseName].supplements.push(item);
        }
    });

    // Ordena as versões da mais nova para a mais antiga
    for (const system in systems) {
        systems[system].versions.sort((a, b) => b.nome.localeCompare(a.nome));
    }

    return systems;
}

function renderSystemsHome(systems) {
    navigationHistory.push(() => renderSystemsHome(systems));
    mainElement.innerHTML = `
        <div class="breadcrumb">Início</div>
        <section class="systems-container">
            ${Object.keys(systems).map(name => {
        const system = systems[name];
        const latestVersion = system.versions.length > 0 ? system.versions[0] : null;
        return `
                <div class="system-card">
                    <img src="${system.image}" alt="Imagem de ${name}" class="system-image">
                    <div class="system-card-content">
                        <h3>${name}</h3>
                        ${latestVersion ? `<p>Versão mais recente: ${latestVersion.nome.split('v')[1]}</p>` : '<p>Nenhuma versão principal encontrada.</p>'}
                        <button onclick="renderSystemVersions('${name}')">Mais Informações</button>
                    </div>
                </div>
                `;
    }).join('')}
        </section>
    `;
}

function renderSystemVersions(systemName) {
    const systems = groupData(dados);
    const system = systems[systemName];
    navigationHistory.push(() => renderSystemVersions(systemName));

    mainElement.innerHTML = `
        <div class="breadcrumb"><a href="#" onclick="goBack(event)">Início</a> > ${systemName}</div>
        <section class="versions-container">
            <h2>Versões de ${systemName}</h2>
            <div class="version-buttons">
                ${system.versions.map(version => `
                    <button onclick="renderVersionDetails('${systemName}', '${version.nome}')">
                        Acessar Versão ${version.nome.split('v')[1] || version.nome}
                    </button>
                `).join('')}
            </div>
        </section>
    `;
}

function renderVersionDetails(systemName, versionName) {
    const systems = groupData(dados);
    const system = systems[systemName];
    const version = system.versions.find(v => v.nome === versionName);

    // Filtra suplementos que correspondem à versão (ex: "(f&m 2.0/2.5.2)")
    const versionNumber = versionName.match(/(\d+\.\d+(\.\d+)?b?)/)[0];
    const relatedSupplements = system.supplements.filter(sup =>
        sup.nome.includes(versionNumber)
    );

    mainElement.innerHTML = `
        <div class="breadcrumb">
            <a href="#" onclick="goBack(event, 2)">Início</a> > 
            <a href="#" onclick="goBack(event, 1)">${systemName}</a> > 
            ${versionName}
        </div>
        <section class="details-container">
            <h2>${versionName}</h2>
            <p>${version.descricao}</p>
            <div class="pdf-list">
                <h4>Downloads</h4>
                <a href="${version.link_pdf}" target="_blank" class="pdf-link">
                    <img src="https://img.icons8.com/ios-filled/24/000000/pdf.png" alt="PDF"/>
                    ${version.nome} (Sistema Principal)
                </a>
                ${relatedSupplements.map(sup => `
                    <a href="${sup.link_pdf}" target="_blank" class="pdf-link">
                        <img src="https://img.icons8.com/ios-filled/24/000000/pdf.png" alt="PDF"/>
                        ${sup.nome} (Suplemento)
                    </a>
                `).join('')}
            </div>
        </section>
    `;
}

function goBack(event, steps = 1) {
    event.preventDefault();
    if (navigationHistory.length > steps) {
        // Remove a página atual e as anteriores do histórico
        for (let i = 0; i < steps; i++) {
            navigationHistory.pop();
        }
        const previousRenderFunction = navigationHistory.pop();
        previousRenderFunction();
    }
}


window.onload = async () => {
    await fetchData();
    const systems = groupData(dados);
    renderSystemsHome(systems);
};