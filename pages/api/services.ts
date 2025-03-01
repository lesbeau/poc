import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { Service } from 'sequelize/models/Service';
import { ServiceProvider } from 'sequelize/models/ServiceProvider';
import { User } from 'sequelize/models/User';
import sequelize from 'sequelize/db';
import dotenv from 'dotenv';
dotenv.config();

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  // Token verification for protected routes
  if (['POST', 'PUT', 'DELETE'].includes(method || '')) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  }

  try {
    const { id } = req.query;

    // Handle operations for specific service IDs
    if (id && typeof id === 'string') {
      switch (req.method) {
        case 'GET': {
          // Get a Service by ID
          const service = await Service.findByPk(id);
          if (!service) {
            return res.status(404).json({ message: 'Service not found' });
          }
          return res.status(200).json(service);
        }
        case 'PUT': {
          // Update a Service
          const { name, description, price } = req.body;
          const service = await Service.findByPk(id);
          if (!service) {
            return res.status(404).json({ message: 'Service not found' });
          }

          service.name = name ?? service.name;
          service.description = description ?? service.description;
          service.price = price ?? service.price;
          service.updated_at = new Date();

          await service.save();
          return res.status(200).json({ message: 'Service updated successfully', service });
        }
        case 'DELETE': {
          // Delete a Service
          const service = await Service.findByPk(id);
          if (!service) {
            return res.status(404).json({ message: 'Service not found' });
          }

          await service.destroy();
          return res.status(200).json({ message: 'Service deleted successfully' });
        }
        default:
          res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
          return res.status(405).json({ message: `Method ${req.method} not allowed` });
      }
    }

    // Handle operations for all services
    switch (req.method) {
      case 'GET': {
        // Get all Services
        const services = await Service.findAll();
        return res.status(200).json(services);
      }
      case 'POST': {
        // Create a new Service
        const { name, description, price, provider_id } = req.body;
        const service = await Service.create({
          name,
          description,
          price,
          provider_id,
          created_at: new Date(),
          updated_at: new Date(),
        });
        return res.status(201).json({ message: 'Service created successfully', service });
      }
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Error processing request', error });
  }
};

export default handler;
