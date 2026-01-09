/**
 * Facet Definition Contract
 * Defines the structure of an analysis facet
 */

/**
 * @typedef {Object} Facet
 * @property {string} id - Unique facet identifier (e.g., 'security')
 * @property {string} name - Human-readable name
 * @property {string} description - What this facet analyzes
 * @property {string} systemPrompt - System instructions for this facet
 * @property {string[]} focusAreas - Key areas this facet focuses on
 * @property {string[]} keywords - Keywords to look for in analysis
 * @property {Object} constraints - Domain lock constraints
 */

/**
 * Validate a facet definition
 * @param {Facet} facet - The facet to validate
 * @throws {Error} If facet is invalid
 * @returns {boolean} True if valid
 */
export function validateFacet(facet) {
    if (!facet || typeof facet !== 'object') {
        throw new Error('Facet must be an object');
    }

    if (!facet.id || typeof facet.id !== 'string') {
        throw new Error('Facet must have a valid id (string)');
    }

    if (!facet.name || typeof facet.name !== 'string') {
        throw new Error('Facet must have a valid name (string)');
    }

    if (!facet.systemPrompt || typeof facet.systemPrompt !== 'string') {
        throw new Error('Facet must have a systemPrompt (string)');
    }

    if (!Array.isArray(facet.focusAreas) || facet.focusAreas.length === 0) {
        throw new Error('Facet must have at least one focus area');
    }

    return true;
}

/**
 * Facet template
 */
export const FacetTemplate = {
    id: '',
    name: '',
    description: '',
    systemPrompt: '',
    focusAreas: [],
    keywords: [],
    constraints: {
        mustInclude: [],
        mustAvoid: [],
        format: 'structured'
    }
};
