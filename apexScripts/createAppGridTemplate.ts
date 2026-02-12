public class InputPayload {
   public String methodName { get; set; }
   public String userId { get; set; }
   public String templateName { get; set; }
}

// Assuming AgWrapperCloneConfig is a class or structure you've defined
AgWrapperCloneConfig result;

// Create an instance of the input payload class
InputPayload inputPayload = new InputPayload();

inputPayload.methodName = 'createAppGridTemplate';
inputPayload.userId = '005Hs00000DCzFbIAL';
inputPayload.templateName = 'Sales';

// Serialize the input payload to JSON
String jsonStr = JSON.serialize(inputPayload);
System.debug(jsonStr);

// Invoke your REST service method
AppGridController.myRestService(jsonStr);