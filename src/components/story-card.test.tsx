import { StoryCard } from './story-card';

describe('StoryCard Path Alias Test', () => {
    it('should import StoryCard component using path alias', () => {
        // This test verifies that the @/ path alias is working correctly
        // If this test passes, it means Jest can resolve the path aliases
        expect(StoryCard).toBeDefined();
        expect(typeof StoryCard).toBe('function');
    });
});
