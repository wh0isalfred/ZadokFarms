# Calling-code data and input normalisation

`src/data/calling-codes.json` is a reduced snapshot of Google's libphonenumber
`resources/PhoneNumberMetadata.xml`, pinned to commit
`806ee32e8c8c74ca339d8c91a6d86ef58687c9f4`. The source URL is stored in the JSON.
Copyright (C) 2009 The Libphonenumber Authors; Apache License 2.0, reproduced in
`licenses/libphonenumber.txt`. This snapshot extracts country names, calling codes
and national-prefix metadata; it is not the libphonenumber runtime library.

The native select includes all 245 geographic country/territory entries in that
source, alphabetically by name. Shared codes intentionally have multiple entries
(for example, US and Canada both use +1). Global service numbers are not countries
and are excluded. Territories without supported numbering plans in the source,
such as Pitcairn, do not get invented calling codes.

To refresh, review an upstream commit and run:

```sh
python scripts/update-calling-codes.py <full-reviewed-upstream-commit-sha>
npm test
```

The updater uses Python's standard library only. Review the data and licence diff,
especially national-prefix transforms and shared-code changes; update this pinned
reference. There is no runtime network request or additional package dependency.

Normalisation accepts local/national digits with ordinary spacing, parentheses,
dots and hyphens. It removes/transforms a national dialling prefix only when the
result matches that region's general numbering pattern. Significant leading zeroes
(such as Italian numbers) remain. Full international paste is also supported.
The existing international-string schema remains the submission authority; this
does not validate WhatsApp registration, reachability or every national number type.

Stored full numbers are projected into the UI without rewriting the saved request.
Shared-code restoration uses an applicable leading-digit rule, otherwise the
source's main region (or first matching region). The calling code and digits remain
unchanged; a number alone does not always identify its country. New drafts retain
the explicit selection and typed national value alongside the existing canonical
draft string. Unknown legacy international codes stay visible under “Saved
international number”; changing that selection explicitly starts a new local number.
Retries always use the original saved canonical payload/key, never this projection.
