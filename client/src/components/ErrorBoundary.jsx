import React from 'react';

  export default class ErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state={hasError:false,error:null}; }
    static getDerivedStateFromError(e){return{hasError:true,error:e};}
    componentDidCatch(e,i){console.error('[ERROR BOUNDARY]',e,i);}
    render(){
      if(this.state.hasError){
        return React.createElement('div',{
          style:{padding:'40px 20px',background:'#0a0f1e',color:'#f87171',fontFamily:'monospace',minHeight:'100vh',textAlign:'center'}
        },
          React.createElement('h1',null,'⚠️ APP CRASH'),
          React.createElement('pre',{
            style:{background:'rgba(0,0,0,0.5)',padding:'20px',borderRadius:'8px',whiteSpace:'pre-wrap',textAlign:'left',maxWidth:'800px',margin:'20px auto'}
          }, this.state.error?.toString?.() || 'Unknown'),
          React.createElement('p',{style:{color:'#94a3b8'}},'Browser console mein F12 → Console check karo')
        );
      }
      return this.props.children;
    }
  }
  