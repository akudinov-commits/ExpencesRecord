const { builtinModules } = require('node:module');

const builtins = builtinModules.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
const backendSdk = 'node_modules/(?:fastify|googleapis|@google-cloud|@google)/';

module.exports = {
  forbidden: [
    { name: 'no-circular-dependencies', severity: 'error', from: {}, to: { circular: true } },
    { name: 'no-unresolved', severity: 'error', from: {}, to: { couldNotResolve: true } },
    { name: 'application-no-outward', severity: 'error', from: { path: '^apps/api/src/application/' }, to: { path: '^(?:api/|apps/web/|apps/api/src/(?:api|infrastructure|bootstrap)/|apps/api/src/server\\.ts$)' } },
    { name: 'application-no-external', severity: 'error', from: { path: '^apps/api/src/application/' }, to: { dependencyTypes: ['core', 'npm', 'npm-dev'] } },
    { name: 'frontend-no-backend', severity: 'error', from: { path: '^apps/web/src/' }, to: { path: '^(?:apps/api/|api/)' } },
    { name: 'frontend-no-node-or-backend-sdk', severity: 'error', from: { path: '^apps/web/src/' }, to: { path: `^(?:(?:node:)?(?:${builtins})$|${backendSdk})` } },
    { name: 'contracts-only-wire-types', severity: 'error', from: { path: '^packages/contracts/src/' }, to: { pathNot: '^packages/contracts/src/' } },
    { name: 'controllers-no-infrastructure', severity: 'error', from: { path: '^apps/api/src/api/' }, to: { path: '^(?:api/|apps/web/|apps/api/src/(?:infrastructure|bootstrap)/|apps/api/src/server\\.ts$)' } },
    { name: 'controllers-no-google-sdk', severity: 'error', from: { path: '^apps/api/src/api/' }, to: { path: '^node_modules/(?:googleapis|@google-cloud|@google)/' } },
    { name: 'infrastructure-only-inward', severity: 'error', from: { path: '^apps/api/src/infrastructure/' }, to: { path: '^(?:api/|apps/web/|apps/api/src/(?:api|bootstrap)/|apps/api/src/server\\.ts$|apps/api/src/application/(?!ports/))' } },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    exclude: { path: '(?:^|/)(?:test|dist)/' },
    enhancedResolveOptions: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      conditionNames: ['types', 'import', 'default'],
    },
  },
};
