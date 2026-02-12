import getDefaultObjFields from "./defaultObjFieldsService";

async function defaultLayoutColumnsService(sObjectApiName: string) {
  try {
    const apiResponse: any = await getDefaultObjFields(sObjectApiName);

    if (apiResponse.data.status == "error") {
      throw new Error(apiResponse.errorMessage);
    }

    return apiResponse.data.fields;
  } catch (error: any) {
    console.log(`defaultLayoutColumnsService - ${error.message}`);
    throw new Error(`defaultLayoutColumnsService - ${error.message}`);
  }
}

export default defaultLayoutColumnsService;
