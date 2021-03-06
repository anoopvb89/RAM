import * as mongoose from 'mongoose';
import {IRAMObject, RAMSchema} from './base';
import {
    HrefValue,
    Name as DTO
} from '../../../commons/RamAPI';

// enums, utilities, helpers ..........................................................................................

// schema .............................................................................................................

const NameSchema = RAMSchema({
    givenName: {
        type: String,
        trim: true,
        required: [function () {
            return this.familyName || !this.unstructuredName;
        }, 'Given Name or Unstructured Name is required']
    },
    familyName: {
        type: String,
        trim: true
    },
    unstructuredName: {
        type: String,
        trim: true,
        required: [function () {
            return !this.givenName && !this.familyName;
        }, 'Given Name or Unstructured Name is required']
    }
});

NameSchema.pre('validate', function (next:() => void) {
    if ((this.givenName || this.familyName) && this.unstructuredName) {
        throw new Error('Given/Family Name and Unstructured Name cannot both be specified');
    } else {
        next();
    }
});

// interfaces .........................................................................................................

export interface IName extends IRAMObject {
    givenName?: string;
    familyName?: string;
    unstructuredName?: string;
    toHrefValue():Promise<HrefValue<DTO>>;
    toDTO():Promise<DTO>;
}

/* tslint:disable:no-empty-interfaces */
export interface INameModel extends mongoose.Model<IName> {
}

// instance methods ...................................................................................................

NameSchema.method('toHrefValue', async function (includeValue:boolean) {
    return new HrefValue(
        null, // TODO do these have endpoints?
        includeValue ? this.toDTO() : undefined
    );
});

NameSchema.method('toDTO', async function () {
    return new DTO(
        this.givenName,
        this.familyName,
        this.unstructuredName
    );
});

// static methods .....................................................................................................

// concrete model .....................................................................................................

export const NameModel = mongoose.model(
    'Name',
    NameSchema) as INameModel;
