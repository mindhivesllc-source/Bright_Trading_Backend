export interface PublicUser {
  id: string;

  name: string;

  firstName: string;
  lastName: string;

  email: string;

  companyName: string;
  salesPerson: string;
  mobileNumber: string;

  address: string;
  state: string;
  city: string;
  zipCode: string;

  createdAt: Date;
  updatedAt: Date;
}