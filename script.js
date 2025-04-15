// Variables globales pour stocker les données
let donnees = {
    ca: 100000,
    cv: 60000,
    cf: 30000,
    pvu: 100,
    quantite: 1000,
    tauxTVA: 20,
    variationPrix: -10,
    elasticite: 1.5
}

// Fonction pour mettre à jour le scénario
function mettreAJourScenario(prixApres, quantiteApres, cvUnitaire) {
    // Si les paramètres ne sont pas fournis, utiliser les valeurs initiales
    prixApres = prixApres || donnees.pvu;
    quantiteApres = quantiteApres || donnees.quantite;
    cvUnitaire = cvUnitaire || (donnees.cv / donnees.quantite);
    
    // Calculs pour la situation initiale
    const caInitial = donnees.ca;
    const cvInitial = donnees.cv;
    const mscvInitial = caInitial - cvInitial;
    const cfInitial = donnees.cf;
    const resultatInitial = mscvInitial - cfInitial;
    
    // Calculs pour la situation après modification
    const caModifie = prixApres * quantiteApres;
    const cvModifie = cvUnitaire * quantiteApres;
    const mscvModifie = caModifie - cvModifie;
    const cfModifie = donnees.cf; // On suppose que les coûts fixes restent constants
    const resultatModifie = mscvModifie - cfModifie;
    
    // Calcul des variations
    const caVariation = caModifie - caInitial;
    const cvVariation = cvModifie - cvInitial;
    const mscvVariation = mscvModifie - mscvInitial;
    const cfVariation = cfModifie - cfInitial;
    const resultatVariation = resultatModifie - resultatInitial;
    
    // Mise à jour du tableau
    document.getElementById('scenario-ca-initial').textContent = formatMonetaire(caInitial);
    document.getElementById('scenario-ca-modifie').textContent = formatMonetaire(caModifie);
    document.getElementById('scenario-ca-variation').textContent = formatMonetaireAvecSigne(caVariation);
    
    document.getElementById('scenario-cv-initial').textContent = formatMonetaire(cvInitial);
    document.getElementById('scenario-cv-modifie').textContent = formatMonetaire(cvModifie);
    document.getElementById('scenario-cv-variation').textContent = formatMonetaireAvecSigne(cvVariation);
    
    document.getElementById('scenario-mscv-initial').textContent = formatMonetaire(mscvInitial);
    document.getElementById('scenario-mscv-modifie').textContent = formatMonetaire(mscvModifie);
    document.getElementById('scenario-mscv-variation').textContent = formatMonetaireAvecSigne(mscvVariation);
    
    document.getElementById('scenario-cf-initial').textContent = formatMonetaire(cfInitial);
    document.getElementById('scenario-cf-modifie').textContent = formatMonetaire(cfModifie);
    document.getElementById('scenario-cf-variation').textContent = formatMonetaireAvecSigne(cfVariation);
    
    document.getElementById('scenario-resultat-initial').textContent = formatMonetaire(resultatInitial);
    document.getElementById('scenario-resultat-modifie').textContent = formatMonetaire(resultatModifie);
    document.getElementById('scenario-resultat-variation').textContent = formatMonetaireAvecSigne(resultatVariation);
    
    // Mise à jour de la conclusion
    let conclusion = '';
    let decision = '';
    let decisionClass = '';
    
    if (resultatVariation > 0) {
        conclusion = "La modification des prix entraîne une augmentation du résultat de " + formatMonetaire(resultatVariation) + 
            ", soit une hausse de " + formatPourcentage(resultatVariation / resultatInitial * 100) + " par rapport à la situation initiale.";
        decision = "ACCEPTER la modification";
        decisionClass = "positive";
    } else if (resultatVariation < 0) {
        conclusion = "La modification des prix entraîne une diminution du résultat de " + formatMonetaire(Math.abs(resultatVariation)) + 
            ", soit une baisse de " + formatPourcentage(Math.abs(resultatVariation) / resultatInitial * 100) + " par rapport à la situation initiale.";
        decision = "REJETER la modification";
        decisionClass = "negative";
    } else {
        conclusion = "La modification des prix n'a pas d'impact sur le résultat.";
        decision = "NEUTRE";
        decisionClass = "neutral";
    }
    
    document.getElementById('scenario-conclusion').textContent = conclusion;
    const decisionElement = document.getElementById('decision');
    decisionElement.textContent = decision;
    decisionElement.className = 'decision-value ' + decisionClass;
}

// Fonctions utilitaires pour le formatage
function formatMonetaire(valeur) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(valeur);
}

function formatMonetaireAvecSigne(valeur) {
    const formatValeur = Math.abs(valeur).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
    return valeur >= 0 ? '+' + formatValeur : '-' + formatValeur;
}

function formatNombre(valeur) {
    return new Intl.NumberFormat('fr-FR').format(valeur);
}

function formatPourcentage(valeur) {
    return valeur >= 0 
        ? '+' + valeur.toFixed(2) + '%' 
        : valeur.toFixed(2) + '%';
}

// Fonctions pour le zoom du graphique
function zoomChart(factor) {
    // Ajuster le niveau de zoom
    chartScale *= factor;
    
    // Recalculer la valeur minimale de l'axe Y en fonction du zoom
    const maxValue = Math.max(...window.seuilChart.data.datasets[0].data, 
                            ...window.seuilChart.data.datasets[1].data);
    
    // Ajuster la valeur minimale pour créer un effet de zoom
    if (factor < 1) { // Zoom in
        chartMinimumValue = maxValue * (1 - 1/chartScale);
    } else { // Zoom out
        chartMinimumValue = Math.max(0, chartMinimumValue * factor);
    }
    
    // Limites pour éviter un zoom excessif
    if (chartScale < 0.5) chartScale = 0.5;
    if (chartScale > 5) chartScale = 5;
    if (chartMinimumValue < 0) chartMinimumValue = 0;
    
    // Mise à jour du graphique
    window.seuilChart.options.scales.y.min = chartMinimumValue;
    window.seuilChart.update();
}

function resetZoom() {
    // Réinitialiser les variables de zoom
    chartScale = 1;
    chartMinimumValue = 0;
    
    // Mise à jour du graphique
    window.seuilChart.options.scales.y.min = 0;
    window.seuilChart.update();
};

// Charger au démarrage
document.addEventListener('DOMContentLoaded', function() {
    // Initialisation des onglets
    initTabs();
    
    // Initialisation des boutons
    document.getElementById('calculer-ce').addEventListener('click', calculerCompteExploitation);
    document.getElementById('calculer-elasticite').addEventListener('click', calculerElasticite);
    
    // Initialisation des contrôles de zoom pour le graphique
    document.getElementById('zoom-in').addEventListener('click', function() {
        zoomChart(0.8); // Zoomer
    });
    
    document.getElementById('zoom-out').addEventListener('click', function() {
        zoomChart(1.2); // Dézoomer
    });
    
    document.getElementById('reset-zoom').addEventListener('click', function() {
        resetZoom(); // Réinitialiser le zoom
    });
    
    // Calculer les résultats initiaux
    calculerCompteExploitation();
});

// Gestion des onglets
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Désactiver tous les onglets
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Activer l'onglet cliqué
            button.classList.add('active');
            document.getElementById(button.dataset.tab).classList.add('active');
            
            // Si on clique sur l'onglet du seuil de rentabilité, mettre à jour le graphique
            if (button.dataset.tab === 'seuil') {
                calculerSeuilRentabilite();
            }
            
            // Si on clique sur l'onglet du scénario, mettre à jour le tableau
            if (button.dataset.tab === 'scenario') {
                mettreAJourScenario();
            }
        });
    });
}

// Fonction principale pour calculer le compte d'exploitation
function calculerCompteExploitation() {
    // Récupérer les valeurs des champs
    donnees.ca = parseFloat(document.getElementById('ca').value) || 100000;
    donnees.cv = parseFloat(document.getElementById('cv').value) || 60000;
    donnees.cf = parseFloat(document.getElementById('cf').value) || 30000;
    donnees.pvu = parseFloat(document.getElementById('pvu').value) || 100;
    donnees.quantite = parseFloat(document.getElementById('quantite').value) || 1000;
    donnees.tauxTVA = parseFloat(document.getElementById('taux-tva').value) || 20;
    
    // Calculs
    const mscv = donnees.ca - donnees.cv;
    const resultat = mscv - donnees.cf;
    
    // Pourcentages
    const cvPourcentage = (donnees.cv / donnees.ca * 100).toFixed(2) + '%';
    const mscvPourcentage = (mscv / donnees.ca * 100).toFixed(2) + '%';
    const cfPourcentage = (donnees.cf / donnees.ca * 100).toFixed(2) + '%';
    const resultatPourcentage = (resultat / donnees.ca * 100).toFixed(2) + '%';
    
    // Mise à jour des résultats
    document.getElementById('ca-resultat').textContent = formatMonetaire(donnees.ca);
    document.getElementById('cv-resultat').textContent = formatMonetaire(donnees.cv);
    document.getElementById('cv-pourcentage').textContent = cvPourcentage;
    document.getElementById('mscv-resultat').textContent = formatMonetaire(mscv);
    document.getElementById('mscv-pourcentage').textContent = mscvPourcentage;
    document.getElementById('cf-resultat').textContent = formatMonetaire(donnees.cf);
    document.getElementById('cf-pourcentage').textContent = cfPourcentage;
    document.getElementById('resultat').textContent = formatMonetaire(resultat);
    document.getElementById('resultat-pourcentage').textContent = resultatPourcentage;
    
    // Calcul du seuil de rentabilité
    calculerSeuilRentabilite();
}

// Calcul du seuil de rentabilité
function calculerSeuilRentabilite() {
    // Calcul du taux de marge sur coûts variables
    const tauxMSCV = 1 - (donnees.cv / donnees.ca);
    
    // Calcul du seuil de rentabilité
    const sr = donnees.cf / tauxMSCV;
    
    // Calcul du point mort (en jours)
    const pointMort = 360 * sr / donnees.ca;
    
    // Mise à jour des résultats
    document.getElementById('sr-resultat').textContent = formatMonetaire(sr);
    document.getElementById('point-mort').textContent = Math.round(pointMort) + ' jours';
    document.getElementById('taux-mscv').textContent = (tauxMSCV * 100).toFixed(2) + '%';
    
    // Création du graphique
    creerGraphiqueSR(sr);
}

// Fonction pour créer le graphique du seuil de rentabilité
function creerGraphiqueSR(sr) {
    const canvas = document.getElementById('seuil-graph');
    
    // Supprimer le graphique existant s'il y en a un
    if (window.seuilChart) {
        window.seuilChart.destroy();
    }
    
    // Données pour le graphique
    const maxCA = donnees.ca * 1.5;
    const etapes = 10;
    const labels = [];
    const caData = [];
    const coutsTotauxData = [];
    const cfData = [];
    
    for (let i = 0; i <= etapes; i++) {
        const ca = (maxCA / etapes) * i;
        const coutsTotaux = donnees.cf + (ca * donnees.cv / donnees.ca);
        
        labels.push(Math.round(ca / 1000) + 'K');
        caData.push(ca);
        coutsTotauxData.push(coutsTotaux);
        cfData.push(donnees.cf);
    }
    
    // Création du graphique
    window.seuilChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Chiffre d\'affaires',
                    data: caData,
                    borderColor: '#0a6e5b',
                    backgroundColor: 'rgba(10, 110, 91, 0.1)',
                    fill: true
                },
                {
                    label: 'Coûts totaux (CF + CV)',
                    data: coutsTotauxData,
                    borderColor: '#ff6f00',
                    backgroundColor: 'rgba(255, 111, 0, 0.1)',
                    fill: true
                },
                {
                    label: 'Coûts fixes',
                    data: cfData,
                    borderColor: '#999',
                    backgroundColor: 'rgba(153, 153, 153, 0.2)',
                    borderDash: [5, 5],
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    align: 'start',
                    labels: {
                        boxWidth: 12,
                        font: {
                            size: 10
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'SR: ' + formatMonetaire(sr),
                    font: {
                        size: 14
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatMonetaire(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Montant (€)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value / 1000 + 'K';
                        }
                    },
                    min: chartMinimumValue
                },
                x: {
                    title: {
                        display: true,
                        text: 'Chiffre d\'affaires'
                    }
                }
            },
            // Ajouter des options de zoom
            pan: {
                enabled: true,
                mode: 'xy'
            },
            zoom: {
                wheel: {
                    enabled: true,
                },
                pinch: {
                    enabled: true
                },
                mode: 'xy'
            }
        }
    });
}

// Calcul de l'élasticité-prix
function calculerElasticite() {
    // Récupérer les valeurs des champs
    donnees.variationPrix = parseFloat(document.getElementById('variation-prix').value) || -10;
    donnees.elasticite = parseFloat(document.getElementById('elasticite').value) || 1.5;
    
    // Calcul de la variation de quantité
    // Élasticité = (ΔQ/Q) / (ΔP/P) donc ΔQ/Q = Élasticité * ΔP/P
    const variationQuantite = -donnees.elasticite * donnees.variationPrix;
    
    // Prix avant et après
    const prixAvant = donnees.pvu;
    const prixApres = prixAvant * (1 + donnees.variationPrix / 100);
    
    // Quantité avant et après
    const quantiteAvant = donnees.quantite;
    const quantiteApres = quantiteAvant * (1 + variationQuantite / 100);
    
    // Chiffre d'affaires avant et après
    const caAvant = prixAvant * quantiteAvant;
    const caApres = prixApres * quantiteApres;
    
    // Calcul des marges
    // On suppose que le coût variable unitaire reste constant
    const cvUnitaire = donnees.cv / donnees.quantite;
    const margeUnitaireAvant = prixAvant - cvUnitaire;
    const margeUnitaireApres = prixApres - cvUnitaire;
    
    const margeAvant = margeUnitaireAvant * quantiteAvant;
    const margeApres = margeUnitaireApres * quantiteApres;
    
    // Mise à jour des résultats
    document.getElementById('prix-avant').textContent = formatMonetaire(prixAvant);
    document.getElementById('prix-apres').textContent = formatMonetaire(prixApres);
    document.getElementById('prix-variation').textContent = donnees.variationPrix + '%';
    
    document.getElementById('quantite-avant').textContent = formatNombre(quantiteAvant);
    document.getElementById('quantite-apres').textContent = formatNombre(quantiteApres);
    document.getElementById('quantite-variation').textContent = formatPourcentage(variationQuantite);
    
    document.getElementById('ca-avant').textContent = formatMonetaire(caAvant);
    document.getElementById('ca-apres').textContent = formatMonetaire(caApres);
    document.getElementById('ca-variation').textContent = formatPourcentage((caApres - caAvant) / caAvant * 100);
    
    document.getElementById('marge-avant').textContent = formatMonetaire(margeAvant);
    document.getElementById('marge-apres').textContent = formatMonetaire(margeApres);
    document.getElementById('marge-variation').textContent = formatPourcentage((margeApres - margeAvant) / margeAvant * 100);
    
    // Mettre à jour le scénario
    mettreAJourScenario(prixApres, quantiteApres, cvUnitaire);
}