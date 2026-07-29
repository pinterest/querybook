ALL_PLUGIN_EXPORTERS = []

# Example to add the Google Sheets exporter
#
# from lib.export.exporters.gspread_exporter import GoogleSheetsExporter
#
# GOOGLE_CLIENT_CONFIG = {...}  # from your Google Cloud OAuth credentials JSON
# ALL_PLUGIN_EXPORTERS = [GoogleSheetsExporter(GOOGLE_CLIENT_CONFIG)]

# Example to add the SharePoint / OneDrive exporter
# Requires env vars: SHAREPOINT_CLIENT_ID, SHAREPOINT_TENANT_ID, SHAREPOINT_CLIENT_SECRET
#
# from lib.export.exporters.sharepoint_exporter import SharePointExporter
#
# ALL_PLUGIN_EXPORTERS = [SharePointExporter()]
