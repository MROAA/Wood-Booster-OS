/*
=====================================

SPACEMONKEY RESTORE GUARD

Turvallisuuskerros ennen
snapshot palautusta.

Ei suorita palautusta.

Vain tarkistaa:

- sallittu
- hyväksyntä vaaditaan

=====================================
*/





function checkRestorePermission(){


  return {


    allowed:

      true,



    approvalRequired:

      true,



    reason:

      "Snapshot restoration requires Safety Core approval."



  }


}







export {

  checkRestorePermission

}
