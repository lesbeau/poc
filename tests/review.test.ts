import { createMocks } from 'node-mocks-http';
import handler from 'pages/api/reviews'; // Import the API handler
import sequelize from 'lib/db';
import { User } from 'lib/models/User';
import { ServiceProvider } from 'lib/models/ServiceProvider';
import jwt from 'jsonwebtoken';

describe('Review API', () => {
  let token: string;
  let providerId: string;
  let reviewId: string;

  beforeAll(async () => {
    // Sync the database
    await sequelize.sync({ force: true });

    // Create a test user and service provider
    const user = await User.create({
      name: 'Test User',
      email: 'testuser@example.com',
      password_hash: 'hashedpassword',
      role: 'customer',
    });

    const provider = await ServiceProvider.create({
      user_id: user.user_id,
      certification: true,
      bio: 'Experienced Barber',
      location: 'Downtown',
      profile_picture: 'profile.jpg',
    });

    providerId = provider.provider_id;

    // Generate a JWT token
    token = jwt.sign({ user_id: user.user_id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should create a new review', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        provider_id: providerId,
        rating: 4.5,
        comment: 'Great service!',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    const data = JSON.parse(res._getData());
    expect(data.message).toBe('Review created successfully');
    expect(data.review).toHaveProperty('review_id');
    reviewId = data.review.review_id;
  });

  it('should fetch all reviews', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it('should fetch reviews for a specific provider', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { providerId },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].provider_id).toBe(providerId);
  });

  it('should fetch a single review by ID', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: reviewId },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.review_id).toBe(reviewId);
  });

  it('should delete a review', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      query: { id: reviewId },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.message).toBe('Review deleted successfully');
  });
});
