import { OrgObject, UserInfo, UserProfile } from './sObjectMetadataTypes'

export interface ApiOrgObjects {
   status: string;
   errorMessage: string;
   orgObjects: OrgObject[]
}

export interface ApiUserInfo {
   status: string;
   errorMessage: string;
   userInfo: UserInfo
}

export interface ApiUserProfile {
   status: string;
   errorMessage: string;
   profile: UserProfile
}