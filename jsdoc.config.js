

module.exports = {
  source: {
    include: ['src'],
  },
  plugins: [
    'plugins/markdown',
    'node_modules/jsdoc-memberof-namespace',
  ],
  templates: {
    default: {
      useLongNameInNav: true,
    },
  },
  opts: {
    template: 'node_modules/minami',
    private: true,
    readme: 'README.md',
    destination: './doc',
    encoding: 'utf8',
    recurse: true,
  },
};
