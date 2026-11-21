const {
  getDirectManual,
  getManualCallTemplates,
  getAllToolNames,
  directGroups,
} = require('../src/manuals');

describe('manuals', () => {
  test('getDirectManual gera manual com tools do grupo', () => {
    const manual = getDirectManual('vost_prociv');
    expect(manual.utcp_version).toBe('1.0.0');
    expect(manual.tools.length).toBeGreaterThan(0);
    expect(manual.tools.every((t) => !t.name.includes('vost_prociv.'))).toBe(true);
  });

  test('getManualCallTemplates inclui templates direct-call e text', () => {
    const templates = getManualCallTemplates();
    expect(templates.some((t) => t.call_template_type === 'direct-call')).toBe(true);
    expect(templates.some((t) => t.call_template_type === 'text' && t.name === 'vost_http')).toBe(true);
  });

  test('getAllToolNames cobre todas as tools', () => {
    const names = getAllToolNames();
    expect(names).toContain('vost_prociv.get_all');
    expect(names).toContain('vost_http.acronym_lookup');
    expect(names.length).toBeGreaterThan(0);
  });

  test('directGroups corresponde aos grupos únicos', () => {
    expect(directGroups).toContain('vost_prociv');
    expect(directGroups).not.toContain('vost_http');
    expect([...new Set(directGroups)]).toEqual(directGroups);
  });
});
