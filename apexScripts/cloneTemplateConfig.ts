public class InputPayload {
   public String methodName { get; set; }
   public String templateId { get; set; }
   public List<String> userIdsToClone { get; set; }
}

List<String> userIdsToClone = new List<String>();
userIdsToClone.add('005Hs00000Du2GyIAJ');

// Assuming AgWrapperCloneConfig is a class or structure you've defined
AgWrapperCloneConfig result;

// Create an instance of the input payload class
InputPayload inputPayload = new InputPayload();

inputPayload.methodName = 'cloneAppGridTemplate';
inputPayload.templateId = 'a03Hs000011QG12IAG';
inputPayload.userIdsToClone = userIdsToClone;

// Serialize the input payload to JSON
String jsonStr = JSON.serialize(inputPayload);
System.debug(jsonStr);

// Invoke your REST service method
AppGridController.myRestService(jsonStr);