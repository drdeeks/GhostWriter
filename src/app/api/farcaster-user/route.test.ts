import { GET } from './route';
import { NextRequest } from '@/test-utils/next-mocks';
// Mock Farcaster types
const UserDataType = {
  USERNAME: 1,
  DISPLAY: 2,
  PFP: 3,
  BIO: 4,
};

const getUserDataByFid = jest.fn();
import { NextResponse } from '@/test-utils/next-mocks';

// Mock the external dependencies
jest.mock('@farcaster/hub-nodejs', () => ({
  getUserDataByFid: jest.fn(),
  UserDataType: {
    USERNAME: 1,
    DISPLAY: 2,
    PFP: 3,
    BIO: 4,
  },
}));

describe('/api/farcaster-user', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if fid is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/farcaster-user');
    const response = await GET(req);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('FID is required');
  });

  it('should return 400 if fid is not a number', async () => {
    const req = new NextRequest('http://localhost:3000/api/farcaster-user?fid=invalid');
    const response = await GET(req);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('FID must be a number');
  });

  it('should return 404 if user not found', async () => {
    const mockGetUserDataByFid = getUserDataByFid as jest.Mock;
    mockGetUserDataByFid.mockResolvedValue(null);
    
    const req = new NextRequest('http://localhost:3000/api/farcaster-user?fid=12345');
    const response = await GET(req);
    
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('User not found');
  });

  it('should return user data successfully', async () => {
    const mockUserData = {
      fid: 12345,
      username: 'testuser',
      display: 'Test User',
      pfp: 'https://example.com/pfp.png',
      bio: 'Test bio',
    };
    
    const mockGetUserDataByFid = getUserDataByFid as jest.Mock;
    mockGetUserDataByFid
      .mockResolvedValueOnce({ data: { userDataBody: { value: 'testuser' } } }) // USERNAME
      .mockResolvedValueOnce({ data: { userDataBody: { value: 'Test User' } } }) // DISPLAY
      .mockResolvedValueOnce({ data: { userDataBody: { value: 'https://example.com/pfp.png' } } }) // PFP
      .mockResolvedValueOnce({ data: { userDataBody: { value: 'Test bio' } } }); // BIO
    
    const req = new NextRequest('http://localhost:3000/api/farcaster-user?fid=12345');
    const response = await GET(req);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockUserData);
  });

  it('should handle errors from Farcaster hub', async () => {
    const mockGetUserDataByFid = getUserDataByFid as jest.Mock;
    mockGetUserDataByFid.mockRejectedValue(new Error('Hub error'));
    
    const req = new NextRequest('http://localhost:3000/api/farcaster-user?fid=12345');
    const response = await GET(req);
    
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to fetch user data');
  });
});