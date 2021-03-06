import {connectDisconnectMongo} from './helpers';
import {Seeder} from '../seeding/seed';
import {
    IIdentity,
    IdentityModel,
    IdentityType,
    IdentityLinkIdScheme,
    IdentityInvitationCodeStatus} from '../models/identity.model';
import {
    IName,
    NameModel} from '../models/name.model';
import {
    IProfile,
    ProfileModel,
    ProfileProvider} from '../models/profile.model';
import {
    IParty,
    PartyModel,
    PartyType} from '../models/party.model';
import {
    IRelationship,
    RelationshipModel,
    RelationshipStatus
} from '../models/relationship.model';
import {IRelationshipType} from '../models/relationshipType.model';

/* tslint:disable:max-func-body-length */
describe('RAM Relationship', () => {

    connectDisconnectMongo();

    let relationshipTypeCustom:IRelationshipType;

    let subjectNickName1:IName;
    let subjectParty1:IParty;

    let delegateNickName1:IName;
    let delegateProfile1:IProfile;
    let delegateParty1:IParty;

    let delegateIdentity1:IIdentity;
    let relationship1:IRelationship;

    beforeEach((done) => {

        Seeder.verbose(false);

        Promise.resolve(null)
            .then()
            .then(Seeder.resetDataInMongo)
            .then(Seeder.loadReference)
            .then(async () => {

                try {

                    relationshipTypeCustom = Seeder.custom_delegate_relationshipType;

                    subjectNickName1 = await NameModel.create({
                        givenName: 'Jane',
                        familyName: 'Subject 1'
                    });

                    subjectParty1 = await PartyModel.create({
                        partyType: PartyType.Individual.name
                    });

                    delegateNickName1 = await NameModel.create({
                        givenName: 'John',
                        familyName: 'Delegate 1'
                    });

                    delegateProfile1 = await ProfileModel.create({
                        provider: ProfileProvider.MyGov.name,
                        name: delegateNickName1
                    });

                    delegateParty1 = await PartyModel.create({
                        partyType: PartyType.Individual.name
                    });

                    delegateIdentity1 = await IdentityModel.create({
                        identityType: IdentityType.InvitationCode.name,
                        defaultInd: true,
                        invitationCodeStatus: IdentityInvitationCodeStatus.Pending.name,
                        invitationCodeExpiryTimestamp: new Date(2055, 1, 1),
                        profile: delegateProfile1,
                        party: delegateParty1
                    });

                    relationship1 = await RelationshipModel.create({
                        relationshipType: relationshipTypeCustom,
                        subject: subjectParty1,
                        subjectNickName: subjectNickName1,
                        delegate: delegateParty1,
                        delegateNickName: delegateNickName1,
                        startTimestamp: new Date(),
                        status: RelationshipStatus.Pending.name
                    });

                } catch (e) {
                    fail('Because ' + e);
                    done();
                }

            }).then(()=> {
                done();
            });
    });

    it('finds by identifier', async (done) => {
        try {

            const retrievedInstance = await RelationshipModel.findByIdentifier(relationship1.id);

            expect(retrievedInstance).not.toBeNull();
            expect(retrievedInstance.id).not.toBeNull();
            expect(retrievedInstance.id).toBe(relationship1.id);

            done();

        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('finds by identifier', async (done) => {
        try {

            const retrievedInstance = await RelationshipModel.findByIdentifier(relationship1.id);

            expect(retrievedInstance).not.toBeNull();
            expect(retrievedInstance.id).not.toBeNull();
            expect(retrievedInstance.id).toBe(relationship1.id);

            done();

        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('finds by invitation code in date range', async (done) => {
        try {

            const retrievedInstance = await RelationshipModel.findPendingByInvitationCodeInDateRange(
                delegateIdentity1.rawIdValue,
                new Date()
            );

            expect(retrievedInstance).not.toBeNull();
            expect(retrievedInstance.id).not.toBeNull();
            expect(retrievedInstance.id).toBe(relationship1.id);

            done();

        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('inserts with no end timestamp', async (done) => {
        try {

            const instance = await RelationshipModel.create({
                relationshipType: relationshipTypeCustom,
                subject: subjectParty1,
                subjectNickName: subjectNickName1,
                delegate: delegateParty1,
                delegateNickName: delegateNickName1,
                startTimestamp: new Date(),
                status: RelationshipStatus.Active.name
            });

            expect(instance).not.toBeNull();
            expect(instance.id).not.toBeNull();
            expect(instance.subject).not.toBeNull();
            expect(instance.status).not.toBeNull();
            expect(instance.statusEnum()).toBe(RelationshipStatus.Active);
            expect(instance.endEventTimestamp).toBeFalsy();

            done();

        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('inserts with end timestamp', async (done) => {
        try {

            const instance = await RelationshipModel.create({
                relationshipType: relationshipTypeCustom,
                subject: subjectParty1,
                subjectNickName: subjectNickName1,
                delegate: delegateParty1,
                delegateNickName: delegateNickName1,
                startTimestamp: new Date(),
                endTimestamp: new Date(),
                status: RelationshipStatus.Active.name
            });

            expect(instance).not.toBeNull();
            expect(instance.id).not.toBeNull();
            expect(instance.subject).not.toBeNull();
            expect(instance.status).not.toBeNull();
            expect(instance.statusEnum()).toBe(RelationshipStatus.Active);
            expect(instance.endEventTimestamp).not.toBeFalsy();

            done();

        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('accepts pending invitation', async (done) => {
        try {

            const acceptingDelegateIdentity1 = await IdentityModel.create({
                rawIdValue: 'accepting_delegate_identity_1',
                identityType: IdentityType.LinkId.name,
                defaultInd: true,
                linkIdScheme: IdentityLinkIdScheme.MyGov.name,
                profile: delegateProfile1,
                party: delegateParty1
            });

            const acceptedInstance = await relationship1.acceptPendingInvitation(acceptingDelegateIdentity1);
            const retrievedAcceptedInstance = await RelationshipModel.findByIdentifier(relationship1.id);

            const retrievedClaimedDelegateIdentity = await IdentityModel.findByIdValue(delegateIdentity1.idValue);
            const retrievedAcceptedDelegateIdentity = await IdentityModel.findByIdValue(acceptingDelegateIdentity1.idValue);

            expect(relationship1.statusEnum()).toBe(RelationshipStatus.Active);
            expect(acceptedInstance.statusEnum()).toBe(relationship1.statusEnum());
            expect(retrievedClaimedDelegateIdentity.invitationCodeStatusEnum()).toBe(IdentityInvitationCodeStatus.Claimed);
            expect(retrievedClaimedDelegateIdentity.invitationCodeClaimedTimestamp).not.toBeNull();
            expect(acceptedInstance.delegate.id).toBe(retrievedAcceptedDelegateIdentity.party.id);
            expect(retrievedAcceptedInstance.delegate.id).toBe(retrievedAcceptedDelegateIdentity.party.id);
            expect(retrievedAcceptedInstance.id).toBe(acceptedInstance.id);

            done();

        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('stores email when notifying delegate', async (done) => {
        try {

            const email = 'test@example.com';
            await relationship1.notifyDelegate(email);

            const retrievedDelegateIdentity = await IdentityModel.findByIdValue(delegateIdentity1.idValue);

            expect(retrievedDelegateIdentity.invitationCodeTemporaryEmailAddress).toBe(email);

            done();

        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('fails accept non-pending invitation', async (done) => {
        try {

            const acceptingDelegateIdentity1 = await IdentityModel.create({
                rawIdValue: 'accepting_delegate_identity_1',
                identityType: IdentityType.LinkId.name,
                defaultInd: true,
                linkIdScheme: IdentityLinkIdScheme.MyGov.name,
                profile: delegateProfile1,
                party: delegateParty1
            });

            await relationship1.acceptPendingInvitation(acceptingDelegateIdentity1);
            expect(relationship1.statusEnum()).toBe(RelationshipStatus.Active);

            await relationship1.acceptPendingInvitation(acceptingDelegateIdentity1);
            fail('should not have been able to accept a non-pending relationship');

            done();

        } catch (e) {
            done();
        }
    });

    it('rejects pending invitation', async (done) => {
        try {

            await relationship1.rejectPendingInvitation();

            const retrievedInstance = await RelationshipModel.findByIdentifier(relationship1.id);
            const retrievedDelegateIdentity = await IdentityModel.findByIdValue(delegateIdentity1.idValue);

            expect(relationship1.statusEnum()).toBe(RelationshipStatus.Invalid);
            expect(retrievedInstance.statusEnum()).toBe(relationship1.statusEnum());
            expect(retrievedDelegateIdentity.invitationCodeStatusEnum()).toBe(IdentityInvitationCodeStatus.Rejected);

            done();

        } catch (e) {
            fail('Because ' + e);
            done();
        }
    });

    it('fails reject non-pending invitation', async (done) => {
        try {

            await relationship1.rejectPendingInvitation();
            expect(relationship1.statusEnum()).toBe(RelationshipStatus.Invalid);

            await relationship1.rejectPendingInvitation();
            fail('should not have been able to reject a non-pending relationship');

            done();

        } catch (e) {
            done();
        }
    });

});