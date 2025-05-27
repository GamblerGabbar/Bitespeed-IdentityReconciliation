// src/models/ContactModel.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { Contact } from './Contact';

interface ContactCreationAttributes extends Optional<Contact, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class ContactModel extends Model<Contact, ContactCreationAttributes> implements Contact {
  public id!: number;
  public phoneNumber!: string | null;
  public email!: string | null;
  public linkedId!: number | null;
  public linkPrecedence!: 'primary' | 'secondary';
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;
}

ContactModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'phoneNumber'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    linkedId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'linkedId',
      references: {
        model: 'contact',
        key: 'id'
      }
    },
    linkPrecedence: {
      type: DataTypes.ENUM('primary', 'secondary'),
      allowNull: false,
      field: 'linkPrecedence'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'createdAt'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updatedAt'
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deletedAt'
    }
  },
  {
    sequelize,
    tableName: 'contact',
    modelName: 'Contact',
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
  }
);

export default ContactModel;