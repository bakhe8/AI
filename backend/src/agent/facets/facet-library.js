/**
 * Facet Library
 * Central registry for all analysis facets
 */

import { validateFacet } from '../contracts/facet.contract.js';
import { securityFacet } from './definitions/security.facet.js';
import { performanceFacet } from './definitions/performance.facet.js';
import { qualityFacet } from './definitions/quality.facet.js';

class FacetLibrary {
    constructor() {
        this.facets = new Map();
        this._registerDefaultFacets();
    }

    /**
     * Register default facets
     * @private
     */
    _registerDefaultFacets() {
        this.register(securityFacet);
        this.register(performanceFacet);
        this.register(qualityFacet);
    }

    /**
     * Register a new facet
     * @param {Object} facet - Facet definition
     * @throws {Error} If facet is invalid or ID already exists
     */
    register(facet) {
        validateFacet(facet);

        if (this.facets.has(facet.id)) {
            throw new Error(`Facet '${facet.id}' is already registered`);
        }

        this.facets.set(facet.id, facet);
        return true;
    }

    /**
     * Get a facet by ID
     * @param {string} facetId - Facet identifier
     * @returns {Object|null} The facet or null if not found
     */
    get(facetId) {
        return this.facets.get(facetId) || null;
    }

    /**
     * Get multiple facets by IDs
     * @param {string[]} facetIds - Array of facet identifiers
     * @returns {Object[]} Array of facets (skips not found)
     */
    getMultiple(facetIds) {
        return facetIds
            .map(id => this.get(id))
            .filter(facet => facet !== null);
    }

    /**
     * List all registered facets
     * @returns {Array<Object>} Array of facet summaries
     */
    list() {
        return Array.from(this.facets.values()).map(facet => ({
            id: facet.id,
            name: facet.name,
            description: facet.description,
            focusAreas: facet.focusAreas
        }));
    }

    /**
     * Check if a facet exists
     * @param {string} facetId - Facet identifier
     * @returns {boolean}
     */
    has(facetId) {
        return this.facets.has(facetId);
    }

    /**
     * Unregister a facet
     * @param {string} facetId - Facet identifier
     * @returns {boolean} True if facet was removed
     */
    unregister(facetId) {
        return this.facets.delete(facetId);
    }

    /**
     * Clear all facets (for testing)
     */
    clear() {
        this.facets.clear();
    }
}

// Singleton instance
const facetLibrary = new FacetLibrary();

export default facetLibrary;
export { FacetLibrary };
