List<Profile> profiles = [SELECT Id, Name FROM Profile];
for (Profile p : profiles) {
  System.debug(p.Name);
}
