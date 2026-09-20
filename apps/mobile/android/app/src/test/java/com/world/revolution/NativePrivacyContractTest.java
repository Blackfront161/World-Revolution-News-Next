package com.world.revolution;

import static org.junit.Assert.assertEquals;

import java.io.File;
import java.util.HashSet;
import java.util.Set;
import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;
import org.junit.Test;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

/** Prevents private WebView state from entering automatic backups or transfers. */
public class NativePrivacyContractTest {
    private static final String ANDROID = "http://schemas.android.com/apk/res/android";

    private Document readXml(String path) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
        // Android's compile stubs omit these JAXP constants; the JVM test uses the JDK parser.
        factory.setAttribute("http://javax.xml.XMLConstants/property/accessExternalDTD", "");
        factory.setAttribute("http://javax.xml.XMLConstants/property/accessExternalSchema", "");
        return factory.newDocumentBuilder().parse(new File(path));
    }

    @Test
    public void manifestKeepsBackupAndCleartextDisabled() throws Exception {
        Element app = (Element) readXml("src/main/AndroidManifest.xml")
            .getElementsByTagName("application").item(0);
        assertEquals("false", app.getAttributeNS(ANDROID, "allowBackup"));
        assertEquals("false", app.getAttributeNS(ANDROID, "fullBackupContent"));
        assertEquals("false", app.getAttributeNS(ANDROID, "usesCleartextTraffic"));
        assertEquals("@xml/data_extraction_rules", app.getAttributeNS(ANDROID, "dataExtractionRules"));
    }

    @Test
    public void cloudAndDeviceTransferExcludeEveryStorageDomain() throws Exception {
        Document rules = readXml("src/main/res/xml/data_extraction_rules.xml");
        assertEquals("data-extraction-rules", rules.getDocumentElement().getTagName());
        assertEquals(0, rules.getElementsByTagName("include").getLength());
        Set<String> expected = Set.of("root", "file", "database", "sharedpref", "external",
            "device_root", "device_file", "device_database", "device_sharedpref");
        for (String transport : Set.of("cloud-backup", "device-transfer")) {
            NodeList sections = rules.getElementsByTagName(transport);
            assertEquals(1, sections.getLength());
            NodeList excludes = ((Element) sections.item(0)).getElementsByTagName("exclude");
            Set<String> actual = new HashSet<>();
            for (int i = 0; i < excludes.getLength(); i++) {
                Element exclusion = (Element) excludes.item(i);
                assertEquals(".", exclusion.getAttribute("path"));
                actual.add(exclusion.getAttribute("domain"));
            }
            assertEquals(expected, actual);
        }
    }
}
