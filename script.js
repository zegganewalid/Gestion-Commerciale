// Classe Produit pour stocker les données d'un produit
class Produit {
    constructor(id, nom = "Nouveau produit", pvHt = 100, paHt = 60, quantite = 500, chargesVar = 10) {
        this.id = id;
        this.nom = nom;
        this.pvHt = pvHt;
        this.paHt = paHt;
        this.quantite = quantite;
        this.chargesVar = chargesVar;
    }

    // Calcul du PV TTC
    getPvTtc(tauxTva) {
        return this.pvHt * (1 + tauxTva / 100);
    }

    // Calcul du CA HT
    getCAHt() {
        return this.pvHt * this.quantite;
    }

    // Calcul du total des charges variables
    getChargesVarTotales() {
        return this.chargesVar * this.quantite;
    }

    // Calcul du total des prix d'achat
    getPAHtTotal() {
        return this.paHt * this.quantite;
    }

    // Calcul de la marge sur CV unitaire
    getMargeUnitaire() {
        return this.pvHt - this.paHt - this.chargesVar;
    }

    // Calcul de la marge sur CV totale
    getMargeTotale() {
        return this.getMargeUnitaire() * this.quantite;
    }

    // Calcul du taux de marge
    getTauxMarge() {
        return (this.pvHt - this.paHt) / this.paHt;
    }

    // Calcul du taux de marque
    getTauxMarque() {
        return (this.pvHt - this.paHt) / this.pvHt;
    }

    // Calcul du coefficient multiplicateur
    getCoefMulti(tauxTva) {
        return this.getPvTtc(tauxTva) / this.paHt;
    }
}

// Gestionnaire de produits
class GestionnaireProduits {
    constructor() {
        this.produits = [];
        this.compteurId = 0;
        this.tauxTva = 20;
        this.chargesFixesDir = 500;
        this.chargesFixesGen = 12000;
    }

    // Ajoute un nouveau produit
    ajouterProduit(nom = "Produit " + (this.produits.length + 1)) {
        const id = this.compteurId++;
        const produit = new Produit(id, nom);
        this.produits.push(produit);
        return produit;
    }

    // Supprime un produit par son ID
    supprimerProduit(id) {
        const index = this.produits.findIndex(p => p.id === id);
        if (index !== -1) {
            this.produits.splice(index, 1);
            return true;
        }
        return false;
    }

    // Retourne un produit par son ID
    getProduit(id) {
        return this.produits.find(p => p.id === id);
    }

    // Met à jour les données d'un produit
    mettreAJourProduit(id, donnees) {
        const produit = this.getProduit(id);
        if (produit) {
            Object.assign(produit, donnees);
            return true;
        }
        return false;
    }

    // Calculs sur l'ensemble des produits
    getCAHtTotal() {
        return this.produits.reduce((total, produit) => total + produit.getCAHt(), 0);
    }

    getPAHtTotal() {
        return this.produits.reduce((total, produit) => total + produit.getPAHtTotal(), 0);
    }

    getChargesVarTotales() {
        return this.produits.reduce((total, produit) => total + produit.getChargesVarTotales(), 0);
    }

    getMargeSurCVTotale() {
        return this.getCAHtTotal() - this.getPAHtTotal() - this.getChargesVarTotales();
    }

    getMargeSurCoutsDirects() {
        return this.getMargeSurCVTotale() - this.chargesFixesDir;
    }

    getResultat() {
        return this.getMargeSurCoutsDirects() - this.chargesFixesGen;
    }

    getCoûtsFixesTotaux() {
        return this.chargesFixesDir + this.chargesFixesGen;
    }

    // Calcul du taux de marge sur coûts variables global
    getTauxMargeSurCV() {
        const ca = this.getCAHtTotal();
        if (ca === 0) return 0;
        return this.getMargeSurCVTotale() / ca;
    }

    // Calcul du seuil de rentabilité
    getSeuilRentabilite() {
        const tauxMsCV = this.getTauxMargeSurCV();
        if (tauxMsCV === 0) return Infinity;
        return this.getCoûtsFixesTotaux() / tauxMsCV;
    }

    // Calcul du point mort en jours
    getPointMort() {
        const ca = this.getCAHtTotal();
        if (ca === 0) return Infinity;
        return 360 * this.getSeuilRentabilite() / ca;
    }

    // Calcul de la quantité au seuil de rentabilité
    getQuantiteSR() {
        const sr = this.getSeuilRentabilite();
        // On utilise une moyenne pondérée pour estimer la quantité au SR
        const totalUnites = this.produits.reduce((total, produit) => total + produit.quantite, 0);
        if (totalUnites === 0) return 0;
        
        const caPerUnite = this.getCAHtTotal() / totalUnites;
        if (caPerUnite === 0) return 0;
        
        return Math.round(sr / caPerUnite);
    }
}

// Variables globales
let gestionnaire = new GestionnaireProduits();
let chartScale = 1;
let chartMinimumValue = 0;
let seuilChart = null;

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Créer le conteneur pour les messages de statut
    const statutContainer = document.getElementById('statut-container');
    if (!statutContainer) {
        const container = document.createElement('div');
        container.id = 'statut-container';
        container.className = 'statut-container';
        document.body.appendChild(container);
    }
    
    // Initialisation des onglets
    initTabs();
    
    // Ajouter le premier produit par défaut
    if (gestionnaire.produits.length === 0) {
        ajouterProduitUI("Coca Cola");
    }
    
    // Initialisation des événements
    document.getElementById('add-product').addEventListener('click', () => ajouterProduitUI());
    document.getElementById('calculer-ce').addEventListener('click', calculerCompteExploitation);
    document.getElementById('calculer-elasticite').addEventListener('click', calculerElasticite);
    
    // Contrôles de zoom pour le graphique
    document.getElementById('zoom-in').addEventListener('click', function() {
        zoomChart(0.8);
    });
    document.getElementById('zoom-out').addEventListener('click', function() {
        zoomChart(1.2);
    });
    document.getElementById('reset-zoom').addEventListener('click', resetZoom);
    
    // Afficher un message d'accueil
    afficherStatut('Bienvenue! Entrez vos données et cliquez sur Calculer', 'info');
    
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
            
            // Actions spécifiques selon l'onglet
            if (button.dataset.tab === 'seuil') {
                afficherStatut('Chargement du graphique...', 'info');
                setTimeout(() => {
                    creerGraphiqueSR();
                    genererTableauSR();
                    afficherStatut('Graphique prêt!', 'success');
                }, 100);
            } else if (button.dataset.tab === 'elasticite') {
                mettreAJourSelectProduit();
            } else if (button.dataset.tab === 'scenario') {
                mettreAJourScenario();
            }
        });
    });
}

// Ajouter un produit dans l'interface
function ajouterProduitUI(nomDefaut = null) {
    const produit = gestionnaire.ajouterProduit(nomDefaut);
    const template = document.getElementById('product-template');
    const productsList = document.getElementById('products-list');
    
    // Cloner le template
    const productHTML = template.innerHTML
        .replace(/{id}/g, produit.id)
        .replace(/{index}/g, gestionnaire.produits.length)
        .replace(/{defaultName}/g, produit.nom);
    
    // Créer l'élément du produit
    const productElement = document.createElement('div');
    productElement.className = 'product-item';
    productElement.dataset.id = produit.id;
    productElement.innerHTML = productHTML;
    
    // Ajouter au DOM
    productsList.appendChild(productElement);
    
    // Ajouter les écouteurs d'événements
    setupProductListeners(productElement, produit.id);
    
    // Afficher un message
    afficherStatut(`Produit "${produit.nom}" ajouté!`, 'success');
    
    // Recalculer
    calculerCompteExploitation();
    
    return produit.id;
}

// Configurer les écouteurs d'événements pour un produit
function setupProductListeners(productElement, id) {
    // Suppression du produit
    const deleteBtn = productElement.querySelector('.delete-product');
    deleteBtn.addEventListener('click', () => {
        if (gestionnaire.produits.length <= 1) {
            afficherStatut('Vous devez avoir au moins un produit!', 'warning');
            return;
        }
        
        if (confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) {
            gestionnaire.supprimerProduit(id);
            productElement.remove();
            calculerCompteExploitation();
            afficherStatut('Produit supprimé!', 'info');
        }
    });
    
    // Mise à jour du nom
    const nameInput = productElement.querySelector(`#product-name-${id}`);
    nameInput.addEventListener('input', () => {
        gestionnaire.mettreAJourProduit(id, { nom: nameInput.value });
    });
    
    // Mise à jour du prix de vente HT
    const pvHtInput = productElement.querySelector(`#prix-vente-ht-${id}`);
    pvHtInput.addEventListener('input', () => {
        const pvHt = parseFloat(pvHtInput.value) || 0;
        gestionnaire.mettreAJourProduit(id, { pvHt });
        
        // Mettre à jour le prix TTC
        const pvTtcInput = productElement.querySelector(`#prix-vente-ttc-${id}`);
        pvTtcInput.value = (pvHt * (1 + gestionnaire.tauxTva / 100)).toFixed(2);
    });
    
    // Mise à jour du prix d'achat HT
    const paHtInput = productElement.querySelector(`#prix-achat-ht-${id}`);
    paHtInput.addEventListener('input', () => {
        gestionnaire.mettreAJourProduit(id, { paHt: parseFloat(paHtInput.value) || 0 });
    });
    
    // Mise à jour des quantités
    const quantiteInput = productElement.querySelector(`#quantite-${id}`);
    quantiteInput.addEventListener('input', () => {
        gestionnaire.mettreAJourProduit(id, { quantite: parseFloat(quantiteInput.value) || 0 });
    });
    
    // Mise à jour des charges variables
    const chargesVarInput = productElement.querySelector(`#charges-var-${id}`);
    chargesVarInput.addEventListener('input', () => {
        gestionnaire.mettreAJourProduit(id, { chargesVar: parseFloat(chargesVarInput.value) || 0 });
    });
}

// Calculer le compte d'exploitation
function calculerCompteExploitation() {
    // Récupérer les données communes
    gestionnaire.tauxTva = parseFloat(document.getElementById('taux-tva').value) || 20;
    gestionnaire.chargesFixesDir = parseFloat(document.getElementById('charges-fixes-dir').value) || 500;
    gestionnaire.chargesFixesGen = parseFloat(document.getElementById('charges-fixes-gen').value) || 12000;
    
    // Mettre à jour les données des produits depuis l'interface
    gestionnaire.produits.forEach(produit => {
        const element = document.querySelector(`.product-item[data-id="${produit.id}"]`);
        if (element) {
            produit.nom = element.querySelector(`#product-name-${produit.id}`).value;
            produit.pvHt = parseFloat(element.querySelector(`#prix-vente-ht-${produit.id}`).value) || 0;
            produit.paHt = parseFloat(element.querySelector(`#prix-achat-ht-${produit.id}`).value) || 0;
            produit.quantite = parseFloat(element.querySelector(`#quantite-${produit.id}`).value) || 0;
            produit.chargesVar = parseFloat(element.querySelector(`#charges-var-${produit.id}`).value) || 0;
            
            // Mettre à jour le prix TTC affiché
            element.querySelector(`#prix-vente-ttc-${produit.id}`).value = produit.getPvTtc(gestionnaire.tauxTva).toFixed(2);
        }
    });
    
    // Calculs globaux
    const caTotal = gestionnaire.getCAHtTotal();
    const paTotal = gestionnaire.getPAHtTotal();
    const cvTotal = gestionnaire.getChargesVarTotales();
    const mscvTotal = gestionnaire.getMargeSurCVTotale();
    const cfd = gestionnaire.chargesFixesDir;
    const mcdTotal = gestionnaire.getMargeSurCoutsDirects();
    const cfg = gestionnaire.chargesFixesGen;
    const resultat = gestionnaire.getResultat();
    
    // Calcul des pourcentages
    const paPct = caTotal > 0 ? (paTotal / caTotal * 100).toFixed(2) + "%" : "0%";
    const cvPct = caTotal > 0 ? (cvTotal / caTotal * 100).toFixed(2) + "%" : "0%";
    const mscvPct = caTotal > 0 ? (mscvTotal / caTotal * 100).toFixed(2) + "%" : "0%";
    const cfdPct = caTotal > 0 ? (cfd / caTotal * 100).toFixed(2) + "%" : "0%";
    const mcdPct = caTotal > 0 ? (mcdTotal / caTotal * 100).toFixed(2) + "%" : "0%";
    const cfgPct = caTotal > 0 ? (cfg / caTotal * 100).toFixed(2) + "%" : "0%";
    const resultatPct = caTotal > 0 ? (resultat / caTotal * 100).toFixed(2) + "%" : "0%";
    
    // Calcul des cumuls
    const paCumul = caTotal > 0 ? (paTotal / caTotal).toFixed(3) : "0";
    const cvCumul = caTotal > 0 ? ((paTotal + cvTotal) / caTotal).toFixed(3) : "0";
    const mscvCumul = "1.000";
    const cfdCumul = caTotal > 0 ? (1 + cfd / caTotal).toFixed(3) : "1.000";
    const mcdCumul = caTotal > 0 ? (1 + cfd / caTotal + mcdTotal / caTotal).toFixed(3) : "1.000";
    const cfgCumul = caTotal > 0 ? (1 + cfd / caTotal + mcdTotal / caTotal + cfg / caTotal).toFixed(3) : "1.000";
    const resultatCumul = caTotal > 0 ? (1 + cfd / caTotal + mcdTotal / caTotal + cfg / caTotal + resultat / caTotal).toFixed(3) : "1.000";
    
    // Mise à jour des résultats dans le tableau
    document.getElementById('ca-resultat').textContent = formatMonetaire(caTotal);
    document.getElementById('pa-resultat').textContent = formatMonetaire(paTotal);
    document.getElementById('pa-pourcentage').textContent = paPct;
    document.getElementById('pa-cumul').textContent = paCumul;
    document.getElementById('cv-resultat').textContent = formatMonetaire(cvTotal);
    document.getElementById('cv-pourcentage').textContent = cvPct;
    document.getElementById('cv-cumul').textContent = cvCumul;
    document.getElementById('mscv-resultat').textContent = formatMonetaire(mscvTotal);
    document.getElementById('mscv-pourcentage').textContent = mscvPct;
    document.getElementById('mscv-cumul').textContent = mscvCumul;
    document.getElementById('cfd-resultat').textContent = formatMonetaire(cfd);
    document.getElementById('cfd-pourcentage').textContent = cfdPct;
    document.getElementById('cfd-cumul').textContent = cfdCumul;
    document.getElementById('mcd-resultat').textContent = formatMonetaire(mcdTotal);
    document.getElementById('mcd-pourcentage').textContent = mcdPct;
    document.getElementById('mcd-cumul').textContent = mcdCumul;
    document.getElementById('cfg-resultat').textContent = formatMonetaire(cfg);
    document.getElementById('cfg-pourcentage').textContent = cfgPct;
    document.getElementById('cfg-cumul').textContent = cfgCumul;
    document.getElementById('resultat').textContent = formatMonetaire(resultat);
    document.getElementById('resultat-pourcentage').textContent = resultatPct;
    document.getElementById('resultat-cumul').textContent = resultatCumul;
    
    // Mise à jour des indicateurs de rentabilité
    updateIndicateursRentabilite();
    
    // Afficher un message de succès
    afficherStatut('Calcul effectué avec succès!', 'success');
    
    return { caTotal, paTotal, cvTotal, mscvTotal, cfd, mcdTotal, cfg, resultat };
}

// Mettre à jour les indicateurs de rentabilité
function updateIndicateursRentabilite() {
    if (gestionnaire.produits.length === 0) return;
    
    // Calcul des indicateurs
    const tauxMarge = gestionnaire.produits.reduce((sum, p) => sum + p.getTauxMarge() * p.getCAHt(), 0) / gestionnaire.getCAHtTotal();
    const tauxMarque = gestionnaire.produits.reduce((sum, p) => sum + p.getTauxMarque() * p.getCAHt(), 0) / gestionnaire.getCAHtTotal();
    const coefMulti = gestionnaire.produits.reduce((sum, p) => sum + p.getCoefMulti(gestionnaire.tauxTva) * p.getCAHt(), 0) / gestionnaire.getCAHtTotal();
    const margeCVPct = gestionnaire.getTauxMargeSurCV();
    const sr = gestionnaire.getSeuilRentabilite();
    const pointMort = gestionnaire.getPointMort();
    const qteSR = gestionnaire.getQuantiteSR();
    
    // Mise à jour des éléments HTML
    document.getElementById('taux-marge').textContent = isNaN(tauxMarge) ? "-" : (tauxMarge * 100).toFixed(2) + "%";
    document.getElementById('taux-marque').textContent = isNaN(tauxMarque) ? "-" : (tauxMarque * 100).toFixed(2) + "%";
    document.getElementById('coef-multi').textContent = isNaN(coefMulti) ? "-" : coefMulti.toFixed(2);
    document.getElementById('marge-cv-pct').textContent = isNaN(margeCVPct) ? "-" : (margeCVPct * 100).toFixed(2) + "%";
    document.getElementById('sr-value').textContent = isNaN(sr) ? "-" : formatMonetaire(sr);
    document.getElementById('point-mort-value').textContent = isNaN(pointMort) ? "-" : Math.round(pointMort) + " jours";
    document.getElementById('qte-sr').textContent = isNaN(qteSR) ? "-" : formatNombre(qteSR) + " unités";
    
    // Mettre à jour également dans l'onglet Seuil de rentabilité
    document.getElementById('sr-resultat').textContent = isNaN(sr) ? "-" : formatMonetaire(sr);
    document.getElementById('point-mort').textContent = isNaN(pointMort) ? "-" : Math.round(pointMort) + " jours";
    document.getElementById('taux-mscv').textContent = isNaN(margeCVPct) ? "-" : (margeCVPct * 100).toFixed(2) + "%";
}

// Créer le graphique du seuil de rentabilité
function creerGraphiqueSR() {
    const canvas = document.getElementById('seuil-graph');
    if (!canvas || canvas.offsetParent === null) return;
    
    try {
        // Supprimer le graphique existant
        if (seuilChart) {
            seuilChart.destroy();
        }
        
        // Calculs pour le graphique
        const sr = gestionnaire.getSeuilRentabilite();
        const cf = gestionnaire.getCoûtsFixesTotaux();
        const maxCA = Math.max(gestionnaire.getCAHtTotal() * 1.5, sr * 1.5);
        
        // Générer des points pour le graphique
        const etapes = 20;
        const caMax = maxCA;
        const caStep = caMax / etapes;
        
        const labels = [];
        const caData = [];
        const coutsTotauxData = [];
        const cfData = [];
        
        // Calculer le coût variable moyen par unité de CA
        const cvMoyenParCA = gestionnaire.getCAHtTotal() > 0 
            ? (gestionnaire.getPAHtTotal() + gestionnaire.getChargesVarTotales()) / gestionnaire.getCAHtTotal() 
            : 0;
        
        for (let i = 0; i <= etapes; i++) {
            const ca = caStep * i;
            const coutsTotaux = cf + (ca * cvMoyenParCA);
            
            labels.push(Math.round(ca / 1000) + 'K');
            caData.push(ca);
            coutsTotauxData.push(coutsTotaux);
            cfData.push(cf);
        }
        
        // Point exact du SR
        const srIndex = Math.floor(sr / caStep);
        if (srIndex >= 0 && srIndex <= etapes) {
            caData[srIndex] = sr;
            coutsTotauxData[srIndex] = sr;
        }
        
        // Création du graphique
        seuilChart = new Chart(canvas, {
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
                animation: {
                    duration: 1000
                },
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
                    },
                    annotation: {
                        annotations: {
                            line1: {
                                type: 'line',
                                xMin: srIndex,
                                xMax: srIndex,
                                borderColor: 'rgb(255, 99, 132)',
                                borderWidth: 2,
                                label: {
                                    content: 'SR: ' + formatMonetaire(sr),
                                    enabled: true,
                                    position: 'top'
                                }
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
                }
            }
        });
        
        // Mettre à jour le point exact du SR dans le tableau
        document.getElementById('sr-exact-qte').textContent = formatNombre(gestionnaire.getQuantiteSR());
        document.getElementById('sr-exact-ca').textContent = formatMonetaire(sr);
        document.getElementById('sr-exact-ct').textContent = formatMonetaire(sr);
        document.getElementById('sr-exact-cf').textContent = formatMonetaire(cf);
        
    } catch (error) {
        console.error("Erreur lors de la création du graphique:", error);
        afficherStatut('Erreur lors de la création du graphique', 'error');
    }
}

// Générer le tableau de données pour le seuil de rentabilité
function genererTableauSR() {
    const sr = gestionnaire.getSeuilRentabilite();
    const cf = gestionnaire.getCoûtsFixesTotaux();
    const maxCA = Math.max(gestionnaire.getCAHtTotal() * 1.5, sr * 1.5);
    
    // Calculer le coût variable moyen par unité de CA
    const cvMoyenParCA = gestionnaire.getCAHtTotal() > 0 
        ? (gestionnaire.getPAHtTotal() + gestionnaire.getChargesVarTotales()) / gestionnaire.getCAHtTotal() 
        : 0;
    
    // Générer des lignes pour le tableau (environ 20 lignes)
    const etapes = 20;
    const caMax = maxCA;
    const caStep = caMax / etapes;
    
    const tableBody = document.getElementById('sr-data-body');
    tableBody.innerHTML = '';
    
    // Ajouter la ligne pour 0
    const row0 = document.createElement('tr');
    row0.innerHTML = `
        <td>0</td>
        <td>0</td>
        <td>${formatMonetaire(cf)}</td>
        <td>${formatMonetaire(cf)}</td>
        <td>${formatMonetaire(-cf)}</td>
    `;
    tableBody.appendChild(row0);
    
    // Point exact du SR
    const srQte = gestionnaire.getQuantiteSR();
    const srRow = document.createElement('tr');
    srRow.className = 'highlight';
    srRow.innerHTML = `
        <td>${formatNombre(srQte)}</td>
        <td>${formatMonetaire(sr)}</td>
        <td>${formatMonetaire(sr)}</td>
        <td>${formatMonetaire(cf)}</td>
        <td>0</td>
    `;
    
    // Ajouter les autres lignes
    let srInserted = false;
    
    for (let i = 1; i <= etapes; i++) {
        const ca = caStep * i;
        const coutsTotaux = cf + (ca * cvMoyenParCA);
        const marge = ca - coutsTotaux;
        
        // Insérer la ligne du SR avant le premier point positif
        if (!srInserted && marge >= 0) {
            tableBody.appendChild(srRow);
            srInserted = true;
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${Math.round(ca / caStep * srQte / etapes)}</td>
            <td>${formatMonetaire(ca)}</td>
            <td>${formatMonetaire(coutsTotaux)}</td>
            <td>${formatMonetaire(cf)}</td>
            <td>${formatMonetaire(marge)}</td>
        `;
        tableBody.appendChild(row);
    }
    
    // Si le SR n'a pas été inséré (très grand SR), l'ajouter à la fin
    if (!srInserted) {
        tableBody.appendChild(srRow);
    }
}

// Mettre à jour le sélecteur de produit dans l'onglet Élasticité
function mettreAJourSelectProduit() {
    const select = document.getElementById('elasticite-product');
    if (!select) return;
    
    // Vider le sélecteur
    select.innerHTML = '';
    
    // Option pour tous les produits
    const optionAll = document.createElement('option');
    optionAll.value = 'all';
    optionAll.textContent = 'Tous les produits';
    select.appendChild(optionAll);
    
    // Ajouter chaque produit
    gestionnaire.produits.forEach(produit => {
        const option = document.createElement('option');
        option.value = produit.id;
        option.textContent = produit.nom;
        select.appendChild(option);
    });
}



// Fonction améliorée pour mettre à jour le scénario
function mettreAJourScenario(caInitial, caModifie, paInitial, paModifie, cvInitial, cvModifie, margeInitial, margeModifie) {
    // Si pas de paramètres, utiliser les valeurs actuelles
    if (arguments.length === 0) {
        // Récupérer l'état initial
        const initial = calculerCompteExploitation();
        caInitial = initial.caTotal;
        paInitial = initial.paTotal;
        cvInitial = initial.cvTotal;
        margeInitial = initial.mscvTotal;
        
        // Pour la simulation, on utilise les mêmes valeurs (scénario sans changement)
        caModifie = caInitial;
        paModifie = paInitial;
        cvModifie = cvInitial;
        margeModifie = margeInitial;
    }
    
    // Charges fixes (inchangées)
    const cfd = gestionnaire.chargesFixesDir;
    const cfg = gestionnaire.chargesFixesGen;
    
    // Calculs pour la situation initiale
    const mcdInitial = margeInitial - cfd;
    const resultatInitial = mcdInitial - cfg;
    
    // Calculs pour la situation après modification
    const mcdModifie = margeModifie - cfd;
    const resultatModifie = mcdModifie - cfg;
    
    // Calcul des variations
    const caVariation = caModifie - caInitial;
    const paVariation = paModifie - paInitial;
    const cvVariation = cvModifie - cvInitial;
    const margeVariation = margeModifie - margeInitial;
    const cfdVariation = 0; // Les charges fixes directes ne changent pas
    const mcdVariation = mcdModifie - mcdInitial;
    const cfgVariation = 0; // Les charges fixes générales ne changent pas
    const resultatVariation = resultatModifie - resultatInitial;
    
    // Mise à jour du tableau
    document.getElementById('scenario-ca-initial').textContent = formatMonetaire(caInitial);
    document.getElementById('scenario-ca-modifie').textContent = formatMonetaire(caModifie);
    document.getElementById('scenario-ca-variation').textContent = formatMonetaireAvecSigne(caVariation);
    
    document.getElementById('scenario-pa-initial').textContent = formatMonetaire(paInitial);
    document.getElementById('scenario-pa-modifie').textContent = formatMonetaire(paModifie);
    document.getElementById('scenario-pa-variation').textContent = formatMonetaireAvecSigne(paVariation);
    
    document.getElementById('scenario-cv-initial').textContent = formatMonetaire(cvInitial);
    document.getElementById('scenario-cv-modifie').textContent = formatMonetaire(cvModifie);
    document.getElementById('scenario-cv-variation').textContent = formatMonetaireAvecSigne(cvVariation);
    
    document.getElementById('scenario-mscv-initial').textContent = formatMonetaire(margeInitial);
    document.getElementById('scenario-mscv-modifie').textContent = formatMonetaire(margeModifie);
    document.getElementById('scenario-mscv-variation').textContent = formatMonetaireAvecSigne(margeVariation);
    
    document.getElementById('scenario-cfd-initial').textContent = formatMonetaire(cfd);
    document.getElementById('scenario-cfd-modifie').textContent = formatMonetaire(cfd);
    document.getElementById('scenario-cfd-variation').textContent = formatMonetaireAvecSigne(cfdVariation);
    
    document.getElementById('scenario-mcd-initial').textContent = formatMonetaire(mcdInitial);
    document.getElementById('scenario-mcd-modifie').textContent = formatMonetaire(mcdModifie);
    document.getElementById('scenario-mcd-variation').textContent = formatMonetaireAvecSigne(mcdVariation);
    
    document.getElementById('scenario-cfg-initial').textContent = formatMonetaire(cfg);
    document.getElementById('scenario-cfg-modifie').textContent = formatMonetaire(cfg);
    document.getElementById('scenario-cfg-variation').textContent = formatMonetaireAvecSigne(cfgVariation);
    
    document.getElementById('scenario-resultat-initial').textContent = formatMonetaire(resultatInitial);
    document.getElementById('scenario-resultat-modifie').textContent = formatMonetaire(resultatModifie);
    document.getElementById('scenario-resultat-variation').textContent = formatMonetaireAvecSigne(resultatVariation);
    
    // Mise à jour de la conclusion
    let conclusion = '';
    let decision = '';
    let decisionClass = '';
    
    if (resultatInitial === 0 && resultatModifie === 0) {
        conclusion = "Aucun impact sur le résultat, les deux valeurs étant nulles.";
        decision = "NEUTRE";
        decisionClass = "neutral";
    } else if (resultatInitial === 0) {
        // Éviter division par zéro
        const variationTexte = resultatModifie > 0 ? "positive" : "négative";
        conclusion = `La modification des prix génère un résultat ${variationTexte} de ${formatMonetaire(Math.abs(resultatModifie))} à partir d'un résultat initial nul.`;
        decision = resultatModifie > 0 ? "RENTABLE" : "NON RENTABLE";
        decisionClass = resultatModifie > 0 ? "positive" : "negative";
    } else if (resultatVariation > 0) {
        conclusion = `La modification des prix entraîne une augmentation du résultat de ${formatMonetaire(resultatVariation)}, 
            soit une hausse de ${formatPourcentage(resultatVariation / resultatInitial * 100)} par rapport à la situation initiale.`;
        decision = "RENTABLE";
        decisionClass = "positive";
    } else if (resultatVariation < 0) {
        conclusion = `La modification des prix entraîne une diminution du résultat de ${formatMonetaire(Math.abs(resultatVariation))}, 
            soit une baisse de ${formatPourcentage(Math.abs(resultatVariation) / resultatInitial * 100)} par rapport à la situation initiale.`;
        decision = "NON RENTABLE";
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

// Mettre à jour le scénario avec les valeurs calculées
function mettreAJourScenario(caInitial, caModifie, paInitial, paModifie, cvInitial, cvModifie, margeInitial, margeModifie) {
    // Si pas de paramètres, utiliser les valeurs actuelles
    if (arguments.length === 0) {
        // Récupérer l'état initial
        const initial = calculerCompteExploitation();
        caInitial = initial.caTotal;
        paInitial = initial.paTotal;
        cvInitial = initial.cvTotal;
        margeInitial = initial.mscvTotal;
        
        // Pour la simulation, on utilise les mêmes valeurs (scénario sans changement)
        caModifie = caInitial;
        paModifie = paInitial;
        cvModifie = cvInitial;
        margeModifie = margeInitial;
    }
    
    // Charges fixes (inchangées)
    const cfd = gestionnaire.chargesFixesDir;
    const cfg = gestionnaire.chargesFixesGen;
    
    // Calculs pour la situation initiale
    const mcdInitial = margeInitial - cfd;
    const resultatInitial = mcdInitial - cfg;
    
    // Calculs pour la situation après modification
    const mcdModifie = margeModifie - cfd;
    const resultatModifie = mcdModifie - cfg;
    
    // Calcul des variations
    const caVariation = caModifie - caInitial;
    const paVariation = paModifie - paInitial;
    const cvVariation = cvModifie - cvInitial;
    const margeVariation = margeModifie - margeInitial;
    const cfdVariation = 0; // Les charges fixes directes ne changent pas
    const mcdVariation = mcdModifie - mcdInitial;
    const cfgVariation = 0; // Les charges fixes générales ne changent pas
    const resultatVariation = resultatModifie - resultatInitial;
    
    // Mise à jour du tableau
    document.getElementById('scenario-ca-initial').textContent = formatMonetaire(caInitial);
    document.getElementById('scenario-ca-modifie').textContent = formatMonetaire(caModifie);
    document.getElementById('scenario-ca-variation').textContent = formatMonetaireAvecSigne(caVariation);
    
    document.getElementById('scenario-pa-initial').textContent = formatMonetaire(paInitial);
    document.getElementById('scenario-pa-modifie').textContent = formatMonetaire(paModifie);
    document.getElementById('scenario-pa-variation').textContent = formatMonetaireAvecSigne(paVariation);
    
    document.getElementById('scenario-cv-initial').textContent = formatMonetaire(cvInitial);
    document.getElementById('scenario-cv-modifie').textContent = formatMonetaire(cvModifie);
    document.getElementById('scenario-cv-variation').textContent = formatMonetaireAvecSigne(cvVariation);
    
    document.getElementById('scenario-mscv-initial').textContent = formatMonetaire(margeInitial);
    document.getElementById('scenario-mscv-modifie').textContent = formatMonetaire(margeModifie);
    document.getElementById('scenario-mscv-variation').textContent = formatMonetaireAvecSigne(margeVariation);
    
    document.getElementById('scenario-cfd-initial').textContent = formatMonetaire(cfd);
    document.getElementById('scenario-cfd-modifie').textContent = formatMonetaire(cfd);
    document.getElementById('scenario-cfd-variation').textContent = formatMonetaireAvecSigne(cfdVariation);
    
    document.getElementById('scenario-mcd-initial').textContent = formatMonetaire(mcdInitial);
    document.getElementById('scenario-mcd-modifie').textContent = formatMonetaire(mcdModifie);
    document.getElementById('scenario-mcd-variation').textContent = formatMonetaireAvecSigne(mcdVariation);
    
    document.getElementById('scenario-cfg-initial').textContent = formatMonetaire(cfg);
    document.getElementById('scenario-cfg-modifie').textContent = formatMonetaire(cfg);
    document.getElementById('scenario-cfg-variation').textContent = formatMonetaireAvecSigne(cfgVariation);
    
    document.getElementById('scenario-resultat-initial').textContent = formatMonetaire(resultatInitial);
    document.getElementById('scenario-resultat-modifie').textContent = formatMonetaire(resultatModifie);
    document.getElementById('scenario-resultat-variation').textContent = formatMonetaireAvecSigne(resultatVariation);
    
    // Mise à jour de la conclusion
    let conclusion = '';
    let decision = '';
    let decisionClass = '';
    
    if (resultatVariation > 0) {
        conclusion = `La modification des prix entraîne une augmentation du résultat de ${formatMonetaire(resultatVariation)}, 
            soit une hausse de ${formatPourcentage(resultatVariation / resultatInitial * 100)} par rapport à la situation initiale.`;
        decision = "RENTABLE";
        decisionClass = "positive";
    } else if (resultatVariation < 0) {
        conclusion = `La modification des prix entraîne une diminution du résultat de ${formatMonetaire(Math.abs(resultatVariation))}, 
            soit une baisse de ${formatPourcentage(Math.abs(resultatVariation) / resultatInitial * 100)} par rapport à la situation initiale.`;
        decision = "NON RENTABLE";
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

// Fonctions de zoom pour le graphique
function zoomChart(factor) {
    if (!seuilChart) return;
    
    // Ajuster le niveau de zoom
    chartScale *= factor;
    
    // Recalculer la valeur minimale de l'axe Y en fonction du zoom
    const maxValue = Math.max(
        ...seuilChart.data.datasets[0].data,
        ...seuilChart.data.datasets[1].data
    );
    
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
    seuilChart.options.scales.y.min = chartMinimumValue;
    seuilChart.update();
}

function resetZoom() {
    if (!seuilChart) return;
    
    // Réinitialiser les variables de zoom
    chartScale = 1;
    chartMinimumValue = 0;
    
    // Mise à jour du graphique
    seuilChart.options.scales.y.min = 0;
    seuilChart.update();
}

// Afficher un message de statut (notification)
function afficherStatut(message, type = 'info') {
    const statutContainer = document.getElementById('statut-container');
    
    if (!statutContainer) {
        // Créer le conteneur s'il n'existe pas
        const container = document.createElement('div');
        container.id = 'statut-container';
        container.className = 'statut-container';
        document.body.appendChild(container);
    }
    
    const statut = document.createElement('div');
    statut.className = `statut ${type}`;
    statut.textContent = message;
    
    document.getElementById('statut-container').appendChild(statut);
    
    // Supprimer le message après 3 secondes
    setTimeout(() => {
        statut.classList.add('fermeture');
        setTimeout(() => {
            statut.remove();
        }, 500);
    }, 3000);
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

// Version entièrement réécrite pour s'assurer que les données d'élasticité sont correctement transférées au scénario

// Variable globale pour stocker les résultats d'élasticité
let elasticiteResultats = null;

// Fonction pour calculer l'élasticité
function calculerElasticite() {
    // Récupérer les valeurs des champs
    const produitId = document.getElementById('elasticite-product').value;
    const variationPrix = parseFloat(document.getElementById('variation-prix').value) || -10;
    const elasticite = parseFloat(document.getElementById('elasticite').value) || 1.5;
    
    // Calcul de la variation de quantité
    // Élasticité = (ΔQ/Q) / (ΔP/P) donc ΔQ/Q = Élasticité * ΔP/P
    const variationQuantite = -elasticite * variationPrix;
    
    // Créer une copie complète du gestionnaire pour la simulation
    const gestionnaireOriginal = {
        produits: gestionnaire.produits.map(p => ({ ...p })),
        tauxTva: gestionnaire.tauxTva,
        chargesFixesDir: gestionnaire.chargesFixesDir,
        chargesFixesGen: gestionnaire.chargesFixesGen
    };
    
    // ======= SITUATION INITIALE =======
    // Calculer les totaux initiaux
    const caInitial = gestionnaire.getCAHtTotal();
    const paInitial = gestionnaire.getPAHtTotal();
    const cvInitial = gestionnaire.getChargesVarTotales();
    const mscvInitial = gestionnaire.getMargeSurCVTotale();
    const cfdInitial = gestionnaire.chargesFixesDir;
    const mcdInitial = mscvInitial - cfdInitial;
    const cfgInitial = gestionnaire.chargesFixesGen;
    const resultatInitial = mcdInitial - cfgInitial;
    
    console.log("Situation initiale:", {
        caInitial, paInitial, cvInitial, mscvInitial,
        cfdInitial, mcdInitial, cfgInitial, resultatInitial
    });
    
    // ======= APPLIQUER MODIFICATIONS =======
    if (produitId === 'all') {
        // Appliquer les modifications à tous les produits
        gestionnaire.produits.forEach(produit => {
            produit.pvHt *= (1 + variationPrix / 100);
            produit.quantite = Math.round(produit.quantite * (1 + variationQuantite / 100));
        });
    } else {
        // Appliquer les modifications à un seul produit
        const produit = gestionnaire.getProduit(parseInt(produitId));
        if (!produit) {
            afficherStatut('Produit non trouvé!', 'error');
            return;
        }
        produit.pvHt *= (1 + variationPrix / 100);
        produit.quantite = Math.round(produit.quantite * (1 + variationQuantite / 100));
    }
    
    // ======= SITUATION APRÈS MODIFICATION =======
    // Calculer les nouveaux totaux
    const caApres = gestionnaire.getCAHtTotal();
    const paApres = gestionnaire.getPAHtTotal();
    const cvApres = gestionnaire.getChargesVarTotales();
    const mscvApres = gestionnaire.getMargeSurCVTotale();
    const cfdApres = gestionnaire.chargesFixesDir; // Identique à l'initial
    const mcdApres = mscvApres - cfdApres;
    const cfgApres = gestionnaire.chargesFixesGen; // Identique à l'initial
    const resultatApres = mcdApres - cfgApres;
    
    console.log("Situation après:", {
        caApres, paApres, cvApres, mscvApres,
        cfdApres, mcdApres, cfgApres, resultatApres
    });
    
    // ======= STOCKER LES RÉSULTATS POUR LE SCÉNARIO =======
    elasticiteResultats = {
        initial: {
            ca: caInitial,
            pa: paInitial,
            cv: cvInitial,
            mscv: mscvInitial,
            cfd: cfdInitial,
            mcd: mcdInitial,
            cfg: cfgInitial,
            resultat: resultatInitial
        },
        apres: {
            ca: caApres,
            pa: paApres,
            cv: cvApres,
            mscv: mscvApres,
            cfd: cfdApres,
            mcd: mcdApres,
            cfg: cfgApres,
            resultat: resultatApres
        }
    };
    
    // ======= METTRE À JOUR L'INTERFACE ÉLASTICITÉ =======
    // Pour l'affichage, préparer les données spécifiques au produit ou totales
    let prixAvant, prixApres, quantiteAvant, quantiteApres, margeAvant, margeApres;
    
    if (produitId === 'all') {
        // Utiliser les moyennes pondérées pour prix unitaire
        const totalQuantiteAvant = gestionnaireOriginal.produits.reduce((sum, p) => sum + p.quantite, 0);
        const totalQuantiteApres = gestionnaire.produits.reduce((sum, p) => sum + p.quantite, 0);
        
        prixAvant = totalQuantiteAvant > 0 ? caInitial / totalQuantiteAvant : 0;
        prixApres = totalQuantiteApres > 0 ? caApres / totalQuantiteApres : 0;
        
        quantiteAvant = totalQuantiteAvant;
        quantiteApres = totalQuantiteApres;
        
        margeAvant = mscvInitial;
        margeApres = mscvApres;
    } else {
        // Afficher les valeurs du produit spécifique
        const produitOriginal = gestionnaireOriginal.produits.find(p => p.id === parseInt(produitId));
        const produitModifie = gestionnaire.produits.find(p => p.id === parseInt(produitId));
        
        if (produitOriginal && produitModifie) {
            prixAvant = produitOriginal.pvHt;
            prixApres = produitModifie.pvHt;
            
            quantiteAvant = produitOriginal.quantite;
            quantiteApres = produitModifie.quantite;
            
            margeAvant = (produitOriginal.pvHt - produitOriginal.paHt - produitOriginal.chargesVar) * produitOriginal.quantite;
            margeApres = (produitModifie.pvHt - produitModifie.paHt - produitModifie.chargesVar) * produitModifie.quantite;
        } else {
            prixAvant = 0;
            prixApres = 0;
            quantiteAvant = 0;
            quantiteApres = 0;
            margeAvant = 0;
            margeApres = 0;
        }
    }
    
    // Mise à jour de l'interface élasticité
    document.getElementById('prix-avant').textContent = formatMonetaire(prixAvant);
    document.getElementById('prix-apres').textContent = formatMonetaire(prixApres);
    document.getElementById('prix-variation').textContent = variationPrix + "%";
    
    document.getElementById('quantite-avant').textContent = formatNombre(quantiteAvant);
    document.getElementById('quantite-apres').textContent = formatNombre(quantiteApres);
    document.getElementById('quantite-variation').textContent = formatPourcentage(variationQuantite);
    
    document.getElementById('ca-avant').textContent = formatMonetaire(produitId === 'all' ? caInitial : prixAvant * quantiteAvant);
    document.getElementById('ca-apres').textContent = formatMonetaire(produitId === 'all' ? caApres : prixApres * quantiteApres);
    
    const caVariationPct = produitId === 'all'
        ? (caApres - caInitial) / caInitial * 100
        : ((prixApres * quantiteApres) - (prixAvant * quantiteAvant)) / (prixAvant * quantiteAvant) * 100;
    
    document.getElementById('ca-variation').textContent = formatPourcentage(caVariationPct);
    
    document.getElementById('marge-avant').textContent = formatMonetaire(margeAvant);
    document.getElementById('marge-apres').textContent = formatMonetaire(margeApres);
    
    const margeVariationPct = margeAvant !== 0
        ? (margeApres - margeAvant) / margeAvant * 100
        : margeApres > 0 ? 100 : 0;
    
    document.getElementById('marge-variation').textContent = formatPourcentage(margeVariationPct);
    
    // ======= METTRE À JOUR LE SCÉNARIO DIRECTEMENT =======
    mettreAJourScenarioAvecResultatsElasticite();
    
    // ======= RESTAURER LES DONNÉES ORIGINALES =======
    // On restaure les données originales pour éviter que les modifications ne s'accumulent
    gestionnaire.produits = gestionnaireOriginal.produits.map(p => {
        const newProduit = new Produit(p.id);
        Object.assign(newProduit, p);
        return newProduit;
    });
    gestionnaire.tauxTva = gestionnaireOriginal.tauxTva;
    gestionnaire.chargesFixesDir = gestionnaireOriginal.chargesFixesDir;
    gestionnaire.chargesFixesGen = gestionnaireOriginal.chargesFixesGen;
    
    // Afficher un message de succès
    afficherStatut('Impact de l\'élasticité calculé! Voir l\'onglet Scénario pour l\'analyse complète.', 'success');
    
    // Automatiquement passer à l'onglet scénario
    setTimeout(() => {
        const scenarioTab = document.querySelector('.tab-btn[data-tab="scenario"]');
        if (scenarioTab) {
            scenarioTab.click();
        }
    }, 1000);
}

// Fonction pour mettre à jour le scénario avec les résultats d'élasticité
function mettreAJourScenarioAvecResultatsElasticite() {
    if (!elasticiteResultats) {
        return; // Aucun résultat d'élasticité disponible
    }
    
    const { initial, apres } = elasticiteResultats;
    
    // Calcul des variations
    const caVariation = apres.ca - initial.ca;
    const paVariation = apres.pa - initial.pa;
    const cvVariation = apres.cv - initial.cv;
    const mscvVariation = apres.mscv - initial.mscv;
    const cfdVariation = apres.cfd - initial.cfd; // Devrait être 0
    const mcdVariation = apres.mcd - initial.mcd;
    const cfgVariation = apres.cfg - initial.cfg; // Devrait être 0
    const resultatVariation = apres.resultat - initial.resultat;
    
    // Mise à jour du tableau de scénario
    document.getElementById('scenario-ca-initial').textContent = formatMonetaire(initial.ca);
    document.getElementById('scenario-ca-modifie').textContent = formatMonetaire(apres.ca);
    document.getElementById('scenario-ca-variation').textContent = formatMonetaireAvecSigne(caVariation);
    
    document.getElementById('scenario-pa-initial').textContent = formatMonetaire(initial.pa);
    document.getElementById('scenario-pa-modifie').textContent = formatMonetaire(apres.pa);
    document.getElementById('scenario-pa-variation').textContent = formatMonetaireAvecSigne(paVariation);
    
    document.getElementById('scenario-cv-initial').textContent = formatMonetaire(initial.cv);
    document.getElementById('scenario-cv-modifie').textContent = formatMonetaire(apres.cv);
    document.getElementById('scenario-cv-variation').textContent = formatMonetaireAvecSigne(cvVariation);
    
    document.getElementById('scenario-mscv-initial').textContent = formatMonetaire(initial.mscv);
    document.getElementById('scenario-mscv-modifie').textContent = formatMonetaire(apres.mscv);
    document.getElementById('scenario-mscv-variation').textContent = formatMonetaireAvecSigne(mscvVariation);
    
    document.getElementById('scenario-cfd-initial').textContent = formatMonetaire(initial.cfd);
    document.getElementById('scenario-cfd-modifie').textContent = formatMonetaire(apres.cfd);
    document.getElementById('scenario-cfd-variation').textContent = formatMonetaireAvecSigne(cfdVariation);
    
    document.getElementById('scenario-mcd-initial').textContent = formatMonetaire(initial.mcd);
    document.getElementById('scenario-mcd-modifie').textContent = formatMonetaire(apres.mcd);
    document.getElementById('scenario-mcd-variation').textContent = formatMonetaireAvecSigne(mcdVariation);
    
    document.getElementById('scenario-cfg-initial').textContent = formatMonetaire(initial.cfg);
    document.getElementById('scenario-cfg-modifie').textContent = formatMonetaire(apres.cfg);
    document.getElementById('scenario-cfg-variation').textContent = formatMonetaireAvecSigne(cfgVariation);
    
    document.getElementById('scenario-resultat-initial').textContent = formatMonetaire(initial.resultat);
    document.getElementById('scenario-resultat-modifie').textContent = formatMonetaire(apres.resultat);
    document.getElementById('scenario-resultat-variation').textContent = formatMonetaireAvecSigne(resultatVariation);
    
    // Mise à jour de la conclusion
    let conclusion = '';
    let decision = '';
    let decisionClass = '';
    
    // Gérer les cas particuliers (division par zéro, etc.)
    if (Math.abs(resultatVariation) < 0.01) {
        conclusion = "La modification des prix n'a pas d'impact significatif sur le résultat.";
        decision = "NEUTRE";
        decisionClass = "neutral";
    } else if (initial.resultat === 0 && apres.resultat > 0) {
        conclusion = `La modification des prix génère un résultat positif de ${formatMonetaire(apres.resultat)} à partir d'un résultat initial nul.`;
        decision = "RENTABLE";
        decisionClass = "positive";
    } else if (initial.resultat === 0 && apres.resultat < 0) {
        conclusion = `La modification des prix génère un résultat négatif de ${formatMonetaire(apres.resultat)} à partir d'un résultat initial nul.`;
        decision = "NON RENTABLE";
        decisionClass = "negative";
    } else if (resultatVariation > 0) {
        const pourcentage = initial.resultat !== 0 
            ? (resultatVariation / Math.abs(initial.resultat) * 100).toFixed(2)
            : "∞";
        conclusion = `La modification des prix entraîne une augmentation du résultat de ${formatMonetaire(resultatVariation)}, 
            soit une hausse de ${pourcentage}% par rapport à la situation initiale.`;
        decision = "RENTABLE";
        decisionClass = "positive";
    } else if (resultatVariation < 0) {
        const pourcentage = initial.resultat !== 0 
            ? (Math.abs(resultatVariation) / Math.abs(initial.resultat) * 100).toFixed(2)
            : "∞";
        conclusion = `La modification des prix entraîne une diminution du résultat de ${formatMonetaire(Math.abs(resultatVariation))}, 
            soit une baisse de ${pourcentage}% par rapport à la situation initiale.`;
        decision = "NON RENTABLE";
        decisionClass = "negative";
    }
    
    document.getElementById('scenario-conclusion').textContent = conclusion;
    const decisionElement = document.getElementById('decision');
    decisionElement.textContent = decision;
    decisionElement.className = 'decision-value ' + decisionClass;
}

// La fonction mettreAJourScenario originale reste, mais est modifiée pour vérifier
// s'il y a des résultats d'élasticité disponibles
function mettreAJourScenario() {
    // S'il y a des résultats d'élasticité, les utiliser
    if (elasticiteResultats) {
        mettreAJourScenarioAvecResultatsElasticite();
        return;
    }
    
    // Sinon, utiliser les valeurs actuelles (code original)
    const initial = calculerCompteExploitation();
    const caInitial = initial.caTotal;
    const paInitial = initial.paTotal;
    const cvInitial = initial.cvTotal;
    const mscvInitial = initial.mscvTotal;
    const cfd = initial.cfd;
    const mcdInitial = initial.mcdTotal;
    const cfg = initial.cfg;
    const resultatInitial = initial.resultat;
    
    // Pour la simulation sans changement, on utilise les mêmes valeurs
    const caModifie = caInitial;
    const paModifie = paInitial;
    const cvModifie = cvInitial;
    const mscvModifie = mscvInitial;
    const mcdModifie = mcdInitial;
    const resultatModifie = resultatInitial;
    
    // Calcul des variations (toutes à zéro dans ce cas)
    const caVariation = caModifie - caInitial;
    const paVariation = paModifie - paInitial;
    const cvVariation = cvModifie - cvInitial;
    const mscvVariation = mscvModifie - mscvInitial;
    const cfdVariation = 0;
    const mcdVariation = mcdModifie - mcdInitial;
    const cfgVariation = 0;
    const resultatVariation = resultatModifie - resultatInitial;
    
    // Mise à jour du tableau
    document.getElementById('scenario-ca-initial').textContent = formatMonetaire(caInitial);
    document.getElementById('scenario-ca-modifie').textContent = formatMonetaire(caModifie);
    document.getElementById('scenario-ca-variation').textContent = formatMonetaireAvecSigne(caVariation);
    
    document.getElementById('scenario-pa-initial').textContent = formatMonetaire(paInitial);
    document.getElementById('scenario-pa-modifie').textContent = formatMonetaire(paModifie);
    document.getElementById('scenario-pa-variation').textContent = formatMonetaireAvecSigne(paVariation);
    
    document.getElementById('scenario-cv-initial').textContent = formatMonetaire(cvInitial);
    document.getElementById('scenario-cv-modifie').textContent = formatMonetaire(cvModifie);
    document.getElementById('scenario-cv-variation').textContent = formatMonetaireAvecSigne(cvVariation);
    
    document.getElementById('scenario-mscv-initial').textContent = formatMonetaire(mscvInitial);
    document.getElementById('scenario-mscv-modifie').textContent = formatMonetaire(mscvModifie);
    document.getElementById('scenario-mscv-variation').textContent = formatMonetaireAvecSigne(mscvVariation);
    
    document.getElementById('scenario-cfd-initial').textContent = formatMonetaire(cfd);
    document.getElementById('scenario-cfd-modifie').textContent = formatMonetaire(cfd);
    document.getElementById('scenario-cfd-variation').textContent = formatMonetaireAvecSigne(cfdVariation);
    
    document.getElementById('scenario-mcd-initial').textContent = formatMonetaire(mcdInitial);
    document.getElementById('scenario-mcd-modifie').textContent = formatMonetaire(mcdModifie);
    document.getElementById('scenario-mcd-variation').textContent = formatMonetaireAvecSigne(mcdVariation);
    
    document.getElementById('scenario-cfg-initial').textContent = formatMonetaire(cfg);
    document.getElementById('scenario-cfg-modifie').textContent = formatMonetaire(cfg);
    document.getElementById('scenario-cfg-variation').textContent = formatMonetaireAvecSigne(cfgVariation);
    
    document.getElementById('scenario-resultat-initial').textContent = formatMonetaire(resultatInitial);
    document.getElementById('scenario-resultat-modifie').textContent = formatMonetaire(resultatModifie);
    document.getElementById('scenario-resultat-variation').textContent = formatMonetaireAvecSigne(resultatVariation);
    
    // Mise à jour de la conclusion (ici scenario par défaut)
    document.getElementById('scenario-conclusion').textContent = "La modification des prix n'a pas d'impact sur le résultat.";
    const decisionElement = document.getElementById('decision');
    decisionElement.textContent = "NEUTRE";
    decisionElement.className = 'decision-value neutral';
}

// Modifier initTabs pour nettoyer les résultats d'élasticité lors du changement d'onglet
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
            
            // Actions spécifiques selon l'onglet
            if (button.dataset.tab === 'seuil') {
                afficherStatut('Chargement du graphique...', 'info');
                setTimeout(() => {
                    creerGraphiqueSR();
                    genererTableauSR();
                    afficherStatut('Graphique prêt!', 'success');
                }, 100);
            } else if (button.dataset.tab === 'elasticite') {
                mettreAJourSelectProduit();
                // Réinitialiser les résultats d'élasticité quand on revient à cet onglet
                elasticiteResultats = null;
            } else if (button.dataset.tab === 'scenario') {
                // Mettre à jour le scénario en utilisant les derniers résultats d'élasticité, s'il y en a
                mettreAJourScenario();
            } else if (button.dataset.tab === 'exploitation') {
                // Réinitialiser les résultats d'élasticité quand on revient à l'onglet principal
                elasticiteResultats = null;
            }
        });
    });
}