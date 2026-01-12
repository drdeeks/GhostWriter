import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';
import { StoryCreationModal } from './story-creation-modal';

// Mock the useStoryManager hook
jest.mock('../hooks/useContract', () => ({
    useStoryManager: () => ({
        createStory: jest.fn().mockResolvedValue({ success: true, hash: '0x123' }),
        isPending: false,
    }),
}));

describe('StoryCreationModal', () => {
    const defaultProps = {
        open: true,
        onClose: jest.fn(),
        creationCredits: 5,
        onSubmit: jest.fn(),
    };

    it('renders modal with correct title', () => {
        render(<StoryCreationModal {...defaultProps} />);
        expect(screen.getByText('Create New Story')).toBeInTheDocument();
    });

    it('shows credit information', () => {
        render(<StoryCreationModal {...defaultProps} />);
        expect(screen.getByText('5 Credits Available')).toBeInTheDocument();
    });

    it('disables submit when no credits available', () => {
        render(<StoryCreationModal {...defaultProps} creationCredits={0} />);
        const submitButton = screen.getByText('Create Story');
        expect(submitButton).toBeDisabled();
    });

    it('shows warning when no credits available', () => {
        render(<StoryCreationModal {...defaultProps} creationCredits={0} />);
        expect(screen.getByText('No creation credits')).toBeInTheDocument();
    });

    it('allows story type selection', () => {
        render(<StoryCreationModal {...defaultProps} />);
        const normalButton = screen.getByText('Normal Story');
        fireEvent.click(normalButton);
        expect(normalButton).toHaveClass('ring-blue-500');
    });

    it('shows epic story as disabled', () => {
        render(<StoryCreationModal {...defaultProps} />);
        const epicButton = screen.getByText('Epic Story');
        expect(epicButton).toHaveAttribute('disabled');
    });

    it('calls onSubmit when form is submitted', async () => {
        const mockCreateStory = jest.fn().mockResolvedValue({ success: true, hash: '0x123' });
        const mockOnSubmit = jest.fn();

        // Override the mock for this test
        jest.mock('../hooks/useContract', () => ({
            useStoryManager: () => ({
                createStory: mockCreateStory,
                isPending: false,
            }),
        }));

        render(<StoryCreationModal {...defaultProps} onSubmit={mockOnSubmit} />);

        const submitButton = screen.getByText('Create Story');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith('normal');
        });
    });

    it('closes modal when cancel is clicked', () => {
        render(<StoryCreationModal {...defaultProps} />);
        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);
        expect(defaultProps.onClose).toHaveBeenCalled();
    });
});
