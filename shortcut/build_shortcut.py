#!/usr/bin/env python3
"""
Builds "Add to Spend.shortcut" — an Apple Shortcut that posts a transaction
to the app's /api/tx endpoint.

    python3 build_shortcut.py --url https://your-app.vercel.app --key YOUR_API_KEY
"""
import argparse, plistlib, uuid

CATEGORIES = ["Snacks", "Cigarettes", "Breakfast", "Lunch", "Outing with friends",
              "Transportation", "Shopping", "Date", "Rent", "Others"]

def uid():
    return str(uuid.uuid4()).upper()

def text(s):
    """A plain Shortcuts text token."""
    return {"Value": {"string": s}, "WFSerializationType": "WFTextTokenString"}

def tokens(parts):
    """Build a text token from a list of literal strings and ('var', uuid, name) tuples."""
    s, att = "", {}
    for p in parts:
        if isinstance(p, str):
            s += p
        else:
            att[f"{{{len(s)}, 1}}"] = {"OutputUUID": p[1], "Type": "ActionOutput", "OutputName": p[2]}
            s += "￼"
    return {"Value": {"string": s, "attachmentsByRange": att}, "WFSerializationType": "WFTextTokenString"}

def var(u, name):
    return tokens([("var", u, name)])

def dict_field(pairs):
    """pairs: list of (key string, value token)."""
    return {
        "Value": {"WFDictionaryFieldValueItems": [
            {"WFKey": text(k), "WFItemType": 0, "WFValue": v} for k, v in pairs
        ]},
        "WFSerializationType": "WFDictionaryFieldValue",
    }

def act(ident, params):
    return {"WFWorkflowActionIdentifier": ident, "WFWorkflowActionParameters": params}

def build(url, api_key):
    amt_u, note_u, menu_u, status_u = uid(), uid(), uid(), uid()
    group = uid()
    actions = []

    # 1 — amount
    actions.append(act("is.workflow.actions.ask", {
        "UUID": amt_u, "WFInputType": "Number", "WFAskActionPrompt": "Amount"}))

    # 2 — category menu, one Text action per branch
    actions.append(act("is.workflow.actions.choosefrommenu", {
        "GroupingIdentifier": group, "WFControlFlowMode": 0,
        "WFMenuPrompt": "Category", "WFMenuItems": CATEGORIES}))
    for c in CATEGORIES:
        actions.append(act("is.workflow.actions.choosefrommenu", {
            "GroupingIdentifier": group, "WFControlFlowMode": 1, "WFMenuItemTitle": c}))
        actions.append(act("is.workflow.actions.gettext", {"UUID": uid(), "WFTextActionText": text(c)}))
    actions.append(act("is.workflow.actions.choosefrommenu", {
        "GroupingIdentifier": group, "WFControlFlowMode": 2, "UUID": menu_u}))

    # 3 — optional note
    actions.append(act("is.workflow.actions.ask", {
        "UUID": note_u, "WFInputType": "Text", "WFAskActionPrompt": "Note (optional)"}))

    # 4 — POST it
    actions.append(act("is.workflow.actions.downloadurl", {
        "UUID": uid(),
        "WFURL": url.rstrip("/") + "/api/tx",
        "WFHTTPMethod": "POST",
        "ShowHeaders": True,
        "WFHTTPHeaders": dict_field([("x-api-key", text(api_key))]),
        "WFJSONValues": dict_field([
            ("amount",   var(amt_u, "Provided Input")),
            ("category", var(menu_u, "Menu Result")),
            ("note",     var(note_u, "Provided Input")),
        ]),
    }))

    # 5 — read the reply so failures are visible instead of a fake success
    actions.append(act("is.workflow.actions.getvalueforkey", {
        "UUID": status_u, "WFDictionaryKey": "status"}))

    # 6 — notify with the real result
    actions.append(act("is.workflow.actions.notification", {
        "UUID": uid(),
        "WFNotificationActionTitle": text("Spend"),
        "WFNotificationActionBody": tokens([
            ("var", status_u, "Dictionary Value"), " · ",
            ("var", amt_u, "Provided Input"), " ",
            ("var", menu_u, "Menu Result"),
        ]),
    }))

    return {
        "WFWorkflowActions": actions,
        "WFWorkflowClientVersion": "3612.0.1.3",
        "WFWorkflowMinimumClientVersionString": "900",
        "WFWorkflowMinimumClientVersion": 900,
        "WFWorkflowIcon": {
            "WFWorkflowIconStartColor": 946986751,
            "WFWorkflowIconGlyphNumber": 59511,
        },
        "WFWorkflowImportQuestions": [],
        "WFWorkflowTypes": ["NCWidget", "WatchKit"],
        "WFWorkflowInputContentItemClasses": [
            "WFAppStoreAppContentItem", "WFArticleContentItem", "WFContactContentItem",
            "WFDateContentItem", "WFEmailAddressContentItem", "WFFolderContentItem",
            "WFGenericFileContentItem", "WFImageContentItem", "WFiTunesProductContentItem",
            "WFLocationContentItem", "WFDCMapsLinkContentItem", "WFAVAssetContentItem",
            "WFPDFContentItem", "WFPhoneNumberContentItem", "WFRichTextContentItem",
            "WFSafariWebPageContentItem", "WFStringContentItem", "WFURLContentItem",
        ],
    }

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", required=True, help="Base app URL, e.g. https://spend.vercel.app")
    ap.add_argument("--key", required=True, help="Value of API_KEY from your env")
    ap.add_argument("--out", default="Add to Spend.shortcut")
    a = ap.parse_args()
    with open(a.out, "wb") as f:
        plistlib.dump(build(a.url, a.key), f)
    print(f"Wrote {a.out}")
