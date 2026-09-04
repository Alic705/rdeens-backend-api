import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import Faq from '../src/models/faq.js';

describe('FAQ API Endpoints', () => {
  let createdFaqId;

  beforeAll(async () => {
    // You should connect to a test database here
    // await mongoose.connect(process.env.TEST_MONGO_URI);
  });

  afterAll(async () => {
    // await Faq.deleteMany();
    // await mongoose.connection.close();
  });

  it('should create a new FAQ', async () => {
    const res = await request(app)
      .post('/api/faqs')
      .send({
        question: 'What is your return policy?',
        answer: 'You can return any item within 30 days.'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('question', 'What is your return policy?');
    
    createdFaqId = res.body.data._id;
  });

  it('should get all FAQs', async () => {
    const res = await request(app).get('/api/faqs');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBeTruthy();
  });

  it('should get a single FAQ', async () => {
    const res = await request(app).get(`/api/faqs/${createdFaqId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data._id).toEqual(createdFaqId);
  });

  it('should update an FAQ', async () => {
    const res = await request(app)
      .put(`/api/faqs/${createdFaqId}`)
      .send({
        question: 'Updated Question?'
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.question).toEqual('Updated Question?');
  });

  it('should delete an FAQ', async () => {
    const res = await request(app).delete(`/api/faqs/${createdFaqId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });
});
