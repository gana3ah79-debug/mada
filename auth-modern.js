/* Mada auth compatibility API. The unified controller in auth-final.js owns all UI events. */
(function(){
  function final(){return window.madaAuthFinal||null}
  async function handleLogin(){const a=final();if(a?.login)return a.login();}
  async function handleSignUp(){const a=final();if(a?.signup)return a.signup();}
  async function handleResetPassword(){const a=final();if(a?.reset)return a.reset();}
  window.handleLogin=handleLogin;window.handleSignUp=handleSignUp;window.handleResetPassword=handleResetPassword;
})();
