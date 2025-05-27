import { Request, Response } from 'express';
import { ContactService } from '../services/contactService';
import { IdentifyRequest } from '../models/Contact';

const contactService = new ContactService();

export const identify = async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = req.body as IdentifyRequest;
    
    const normalizedRequest: IdentifyRequest = {
      email: email?.toString(),
      phoneNumber: phoneNumber?.toString()
    };
    
    const result = await contactService.identify(normalizedRequest);
    res.status(200).json(result);
  } catch (error) {
    console.error('Identify error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('must be provided')) {
        res.status(400).json({ error: error.message });
        return;
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};