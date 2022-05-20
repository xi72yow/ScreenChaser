/*
 *    WiFi Settings
 *
 *    For the simplest connection to an existing network
 *    just replace your ssid and password in the line below.
 */

struct station stationList[] = {{"my_ssid","my_password", true}};

/*
 * DHCP is currebtly not to edidt
 
You can extend the stationList[] above with additional SSID+Password pairs

struct station stationList[] = {{"ssid1", "pass1", true},
                                {"ssid2", "pass2", true},
                                {"ssid3", "pass3", true}};

 */
