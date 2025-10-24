/**
 * IoT Edge Comunidad Valenciana - Mapa Conceptual Interactivo
 * Funcionalidades JavaScript
 * Autor: José Javier Gutiérrez Gil
 */

class ConceptualMap {
    constructor() {
        this.concepts = [];
        this.connections = [];
        this.activeElement = null;
        this.isAnimating = false;
        
        this.init();
    }
    
    init() {
        this.setupElements();
        this.setupEventListeners();
        this.setupPanels();
        this.setupAccessibility();
        this.startInitialAnimations();
        
        console.log('🚀 Mapa Conceptual IoT Edge CV inicializado correctamente');
    }
    
    setupElements() {
        // Seleccionar todos los elementos principales
        this.conceptBoxes = document.querySelectorAll('.concept-box');
        this.centralNode = document.getElementById('central-node');
        this.connectionLines = document.querySelectorAll('.connection-line');
        this.methodologyPanel = document.getElementById('methodology-panel');
        this.legendPanel = document.getElementById('legend-panel');
        
        // Crear array de conceptos para manejo más fácil
        this.concepts = Array.from(this.conceptBoxes).map(box => ({
            element: box,
            category: box.dataset.category,
            title: box.querySelector('h3').textContent,
            isActive: false
        }));
        
        console.log(`📊 ${this.concepts.length} conceptos cargados`);
    }
    
    setupEventListeners() {
        // Event listeners para cajas de conceptos
        this.conceptBoxes.forEach((box, index) => {
            // Click events
            box.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleConceptClick(box, index);
            });
            
            // Hover effects
            box.addEventListener('mouseenter', () => {
                this.handleConceptHover(box, true);
            });
            
            box.addEventListener('mouseleave', () => {
                this.handleConceptHover(box, false);
            });
            
            // Keyboard navigation
            box.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleConceptClick(box, index);
                }
            });
            
            // Make focusable
            box.setAttribute('tabindex', '0');
            box.setAttribute('role', 'button');
            box.setAttribute('aria-label', `Explorar concepto: ${box.querySelector('h3').textContent}`);
        });
        
        // Central node interactions
        if (this.centralNode) {
            this.centralNode.addEventListener('click', () => {
                this.resetAllHighlights();
                this.centralNode.classList.add('highlight');
                setTimeout(() => {
                    this.centralNode.classList.remove('highlight');
                }, 1500);
            });
        }
        
        // Connection line interactions
        this.connectionLines.forEach(line => {
            line.addEventListener('mouseenter', () => {
                this.highlightConnectionPath(line);
            });
            
            line.addEventListener('mouseleave', () => {
                this.resetConnectionHighlights();
            });
        });
        
        // Window resize handler
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }
    
    setupPanels() {
        // Setup methodology panel
        const methodologyToggle = document.getElementById('methodology-toggle');
        if (methodologyToggle) {
            methodologyToggle.addEventListener('click', () => {
                this.togglePanel(this.methodologyPanel, 'open');
            });
        }
        
        // Setup legend panel
        const legendToggle = document.getElementById('legend-toggle');
        if (legendToggle) {
            legendToggle.addEventListener('click', () => {
                this.togglePanel(this.legendPanel, 'open');
            });
        }
        
        // Legend item interactions
        const legendItems = document.querySelectorAll('.legend-item');
        legendItems.forEach(item => {
            item.addEventListener('click', () => {
                const category = item.dataset.category;
                this.highlightByCategory(category);
            });
        });
        
        // Close panels when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.methodologyPanel.contains(e.target) && 
                !e.target.matches('#methodology-toggle')) {
                this.methodologyPanel.classList.remove('open');
            }
            
            if (!this.legendPanel.contains(e.target) && 
                !e.target.matches('#legend-toggle')) {
                this.legendPanel.classList.remove('open');
            }
        });
    }
    
    setupAccessibility() {
        // Add ARIA labels and descriptions
        this.conceptBoxes.forEach(box => {
            const title = box.querySelector('h3').textContent;
            const items = Array.from(box.querySelectorAll('.concept-list li'))
                .map(li => li.textContent).join(', ');
            
            box.setAttribute('aria-describedby', `desc-${box.className.split(' ')[1]}`);
            
            // Create hidden description for screen readers
            const desc = document.createElement('div');
            desc.id = `desc-${box.className.split(' ')[1]}`;
            desc.className = 'sr-only';
            desc.textContent = `${title}: ${items}`;
            box.appendChild(desc);
        });
        
        // Add skip navigation
        this.addSkipNavigation();
    }
    
    addSkipNavigation() {
        const skipNav = document.createElement('a');
        skipNav.href = '#central-node';
        skipNav.textContent = 'Saltar a contenido principal';
        skipNav.className = 'skip-nav sr-only';
        skipNav.addEventListener('focus', () => {
            skipNav.classList.remove('sr-only');
        });
        skipNav.addEventListener('blur', () => {
            skipNav.classList.add('sr-only');
        });
        
        document.body.insertBefore(skipNav, document.body.firstChild);
    }
    
    handleConceptClick(box, index) {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        
        // Reset previous selections
        this.resetAllHighlights();
        
        // Set active element
        this.activeElement = box;
        
        // Highlight current concept
        this.highlightConcept(box);
        
        // Show related connections
        this.showRelatedConnections(box);
        
        // Update panels if needed
        this.updatePanelContent(box);
        
        // Analytics tracking (if available)
        this.trackInteraction('concept_click', {
            concept: box.querySelector('h3').textContent,
            category: box.dataset.category,
            index: index
        });
        
        // Reset animation lock
        setTimeout(() => {
            this.isAnimating = false;
        }, 500);
        
        console.log(`🎯 Concepto seleccionado: ${box.querySelector('h3').textContent}`);
    }
    
    handleConceptHover(box, isEntering) {
        if (this.isAnimating) return;
        
        if (isEntering) {
            box.style.transform = 'scale(1.05) translateY(-3px)';
            this.previewConnections(box);
        }
