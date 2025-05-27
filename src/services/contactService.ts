// src/services/contactService.ts
import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import { Contact, IdentifyRequest, IdentifyResponse } from '../models/Contact';
import ContactModel from '../models/ContactModel';

export class ContactService {
  async findContactsByEmailOrPhone(email?: string, phoneNumber?: string): Promise<Contact[]> {
    const whereConditions: any = { deletedAt: null };
    const orConditions: any[] = [];

    if (email) orConditions.push({ email });
    if (phoneNumber) orConditions.push({ phoneNumber });

    if (orConditions.length > 0) whereConditions[Op.or] = orConditions;

    return ContactModel.findAll({
      where: whereConditions,
      order: [['createdAt', 'ASC']],
      raw: true
    }) as unknown as Promise<Contact[]>;
  }

  async findAllLinkedContacts(contactId: number): Promise<Contact[]> {
    const query = `
      WITH RECURSIVE contact_chain AS (
        SELECT c1.* FROM contact c1 WHERE c1.id = :contactId
        UNION
        SELECT c2.* FROM contact c2
        INNER JOIN contact_chain cc ON c2.id = cc."linkedId" OR c2."linkedId" = cc.id
        WHERE c2."deletedAt" IS NULL
      )
      SELECT DISTINCT * FROM contact_chain ORDER BY "createdAt" ASC
    `;

    const contacts = await sequelize.query(query, {
      replacements: { contactId },
      type: QueryTypes.SELECT
    });

    return contacts as Contact[];
  }

  async createContact(
    email?: string,
    phoneNumber?: string,
    linkedId?: number,
    linkPrecedence: 'primary' | 'secondary' = 'primary'
  ): Promise<Contact> {
    const contact = await ContactModel.create({
      email: email || null,
      phoneNumber: phoneNumber || null,
      linkedId: linkedId || null,
      linkPrecedence
    });

    return contact.toJSON() as Contact;
  }

  async updateContactLink(contactId: number, newLinkedId: number): Promise<void> {
    await ContactModel.update(
      {
        linkedId: newLinkedId,
        linkPrecedence: 'secondary',
        updatedAt: new Date()
      },
      { where: { id: contactId, deletedAt: null } }
    );
  }

  private async findAllContactsInCluster(contactId: number): Promise<Contact[]> {
    const query = `
      WITH RECURSIVE cluster AS (
        SELECT id, "linkedId" FROM contact WHERE id = :contactId
        UNION ALL
        SELECT c.id, c."linkedId" FROM contact c
        INNER JOIN cluster cl ON c."linkedId" = cl.id OR c.id = cl."linkedId"
        WHERE c."deletedAt" IS NULL
      )
      SELECT id FROM cluster
    `;

    const clusterIds = await sequelize.query<{ id: number }>(query, {
      replacements: { contactId },
      type: QueryTypes.SELECT
    });

    if (clusterIds.length === 0) return [];
    return ContactModel.findAll({
      where: { id: clusterIds.map(c => c.id), deletedAt: null },
      raw: true
    }) as unknown as Promise<Contact[]>;
  }

  async identify(request: IdentifyRequest): Promise<IdentifyResponse> {
    const { email, phoneNumber } = request;
    if (!email && !phoneNumber) throw new Error('Either email or phoneNumber must be provided');

    const existingContacts = await this.findContactsByEmailOrPhone(email, phoneNumber);
    if (existingContacts.length === 0) {
      const newContact = await this.createContact(email, phoneNumber, undefined, 'primary');
      return this.buildResponse([newContact]);
    }

    const primaryContacts = existingContacts.filter(c => c.linkPrecedence === 'primary');
    const uniquePrimaries = new Set(primaryContacts.map(c => c.id));

    if (uniquePrimaries.size > 1) {
      const sortedPrimaries = Array.from(uniquePrimaries)
        .map(id => primaryContacts.find(c => c.id === id)!)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      const oldestPrimary = sortedPrimaries[0];
      for (let i = 1; i < sortedPrimaries.length; i++) {
        const current = sortedPrimaries[i];
        await this.updateContactLink(current.id, oldestPrimary.id);
        
        const cluster = await this.findAllContactsInCluster(current.id);
        for (const contact of cluster) {
          if (contact.id !== oldestPrimary.id) {
            await this.updateContactLink(contact.id, oldestPrimary.id);
          }
        }
      }
    }

    let primaryContact: Contact;
    if (existingContacts[0].linkPrecedence === 'secondary') {
      if (existingContacts[0].linkedId == null) {
        throw new Error('Primary contact linkedId is null');
      }
      const primary = await ContactModel.findOne({
        where: { id: existingContacts[0].linkedId, deletedAt: null },
        raw: true
      });
      if (!primary) throw new Error('Primary contact not found');
      primaryContact = primary as Contact;
    } else {
      primaryContact = existingContacts
        .filter(c => c.linkPrecedence === 'primary')
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
    }

    const hasNewInfo = (email && !existingContacts.some(c => c.email === email)) ||
                      (phoneNumber && !existingContacts.some(c => c.phoneNumber === phoneNumber));
    if (hasNewInfo) await this.createContact(email, phoneNumber, primaryContact.id, 'secondary');

    const allContacts = await this.findAllLinkedContacts(primaryContact.id);
    return this.buildResponse(allContacts);
  }

  private buildResponse(contacts: Contact[]): IdentifyResponse {
    const primary = contacts.find(c => c.linkPrecedence === 'primary')!;
    const emails = new Set<string>();
    const phones = new Set<string>();
    const secondaryIds: number[] = [];

    if (primary.email) emails.add(primary.email);
    if (primary.phoneNumber) phones.add(primary.phoneNumber);

    contacts.filter(c => c.linkPrecedence === 'secondary').forEach(c => {
      secondaryIds.push(c.id);
      if (c.email) emails.add(c.email);
      if (c.phoneNumber) phones.add(c.phoneNumber);
    });

    return {
      contact: {
        primaryContatctId: primary.id,
        emails: Array.from(emails),
        phoneNumbers: Array.from(phones),
        secondaryContactIds: secondaryIds
      }
    };
  }
}