# Algorithmie structurée 

Création d'une fonction planifyLab(data) qui organise les analyses de laboratoire médical.

- `src/` : code de l'algorithme structurée
- `tests/` : tests de régression (golden master) et tests unitaires

## Installation

### Prérequis

- Node.js 18.18 ou plus
- npm 9 ou plus

### Commandes

```bash
git clone https://github.com/Arvind-V1/planify-lab.git
cd planify-lab
npm install
```

## Exécution

### Exécuter le code refactoré

```bash
npm start -- data.json
```

### Exécuter les tests

```bash
npm test
```

Pour tout valider d'un coup (types, lint, format, tests) :

```bash
npm run check
```


## Outils de qualité

| Outil | Commande |
|---|---|
| TypeScript (mode strict) | `npm run typecheck` |
| ESLint | `npm run lint` |
| Prettier | `npm run format:check` / `npm run format` |
| Tout enchaîner | `npm run check` |