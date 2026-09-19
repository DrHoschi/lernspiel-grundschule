# AUD-04A Parent / Child Identity & Ownership Contract
Status: **DEFINED / VERIFIED / 0 BLOCKER**.
Core authority: Parent and Child identities plus Parent→Child ownership are backend-authoritative. Login finds existing identity; login never creates identity. Local storage is cache/offline queue, not identity or ownership authority.
Parent Account uses stable `parentId`; Child uses stable `childId` and an authoritative ownership context. Display name, email, PIN and profile image are not primary identity.
Parent email/password establishes Parent identity. Parent-PIN is a separate device/adult-area protection boundary and does not replace Parent account identity.
Child login selects an existing authorized profile plus image PIN. Unknown child, wrong PIN or wrong Parent context => deny/no auto-create.
Future multi-guardian semantics are deferred; MVP has one unambiguous owning `parentId`.
Existing name-keyed learning stores are not silently migrated in this contract.