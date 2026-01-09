/**
 * Facet Library Tests
 */

import facetLibrary, { FacetLibrary } from '../facets/facet-library.js';
import { securityFacet } from '../facets/definitions/security.facet.js';

describe('FacetLibrary', () => {
    let library;

    beforeEach(() => {
        library = new FacetLibrary();
    });

    describe('default facets', () => {
        test('should have security facet registered', () => {
            expect(library.has('security')).toBe(true);
            const facet = library.get('security');
            expect(facet).toBeDefined();
            expect(facet.name).toBe('Security Analysis');
        });

        test('should have performance facet registered', () => {
            expect(library.has('performance')).toBe(true);
        });

        test('should have quality facet registered', () => {
            expect(library.has('quality')).toBe(true);
        });
    });

    describe('register', () => {
        test('should register a new facet', () => {
            const customFacet = {
                id: 'custom',
                name: 'Custom Facet',
                description: 'Test',
                systemPrompt: 'Test prompt',
                focusAreas: ['test'],
                keywords: [],
                constraints: {}
            };

            library.clear();
            expect(() => library.register(customFacet)).not.toThrow();
            expect(library.has('custom')).toBe(true);
        });

        test('should reject duplicate facet IDs', () => {
            expect(() => library.register(securityFacet)).toThrow(/already registered/);
        });

        test('should reject invalid facet', () => {
            const invalidFacet = {
                id: 'invalid'
                // missing required fields
            };

            expect(() => library.register(invalidFacet)).toThrow();
        });
    });

    describe('get', () => {
        test('should retrieve a facet by ID', () => {
            const facet = library.get('security');
            expect(facet).toBeDefined();
            expect(facet.id).toBe('security');
        });

        test('should return null for non-existent facet', () => {
            const facet = library.get('non-existent');
            expect(facet).toBeNull();
        });
    });

    describe('getMultiple', () => {
        test('should retrieve multiple facets', () => {
            const facets = library.getMultiple(['security', 'performance']);
            expect(facets).toHaveLength(2);
            expect(facets[0].id).toBe('security');
            expect(facets[1].id).toBe('performance');
        });

        test('should skip non-existent facets', () => {
            const facets = library.getMultiple(['security', 'non-existent', 'quality']);
            expect(facets).toHaveLength(2);
        });
    });

    describe('list', () => {
        test('should list all facets', () => {
            const list = library.list();
            expect(list).toHaveLength(3);
            expect(list[0]).toHaveProperty('id');
            expect(list[0]).toHaveProperty('name');
            expect(list[0]).toHaveProperty('description');
        });
    });

    describe('unregister', () => {
        test('should remove a facet', () => {
            expect(library.has('security')).toBe(true);
            library.unregister('security');
            expect(library.has('security')).toBe(false);
        });
    });
});
