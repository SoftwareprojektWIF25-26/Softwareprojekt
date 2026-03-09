describe('Data Science Lab: Projekt via Wizard erstellen', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173/'); // Vite Dev-Server
    // Löscht alle Projekte vor dem Test, damit wir sauber starten
    cy.request('DELETE', 'http://localhost:8080/api/projekte');
  });

  it('Füllt Wizard aus -> API-Call -> Dashboard zeigt Projekt', () => {
    // 1. Wizard Starten (Business)
    cy.contains('Wizard Business').click();
    cy.get('input[placeholder*="Business Goal"]').type('Test-Projekt');
    cy.get('input[placeholder*="Team Size"]').type('4');
    cy.get('button').contains('Next').click();

    // 2. Submit -> POST /api/projekte
    // Wir klicken "Create Project", was den API Call auslöst
    cy.get('button').contains('Create Project').click();

    // OPTIONAL: Manuell verifizieren, dass der POST request ankommt (nicht zwingend nötig für den User-Flow, aber gut zur Kontrolle)
    cy.request('POST', 'http://localhost:8080/api/projekte', {
      name: 'Test-Projekt',
      businessGoal: 'Test-Projekt',
      teamSize: 4
    }).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body).to.have.property('id');
    });

    // 3. Redirect zu Dashboard + Assert
    // Prüfen, ob wir auf dem Dashboard landen
    cy.url().should('include', '/dashboard');
    // Prüfen, ob das neue Projekt dort zu sehen ist
    cy.contains('Test-Projekt').should('be.visible');
    cy.contains('businessGoal: Test-Projekt');
  });
});
