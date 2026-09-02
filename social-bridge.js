// Bridge the existing app.js lexical state to the feature module without changing app.js.
try{Object.defineProperty(window,'sb',{configurable:true,get:()=>sb});}catch(e){}
try{Object.defineProperty(window,'user',{configurable:true,get:()=>user});}catch(e){}
try{Object.defineProperty(window,'feedPosts',{configurable:true,get:()=>feedPosts});}catch(e){}
