import React from 'react';

  export default class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, errorMsg: '', errorStack: '', errorName: '' };
    }
    static getDerivedStateFromError(error) {
      const msg = error?.message || error?.toString?.() || String(error) || 'Unknown error';
      const stack = error?.stack || 'No stack trace';
      const name = error?.name || 'Error';
      return { hasError: true, errorMsg: msg, errorStack: stack, errorName: name };
    }
    componentDidCatch(error, info) {
      console.error('[ERROR BOUNDARY]', error, info);
      // Send to server for debugging
      try {
        fetch('/api/log-client-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            msg: error?.message || String(error),
            stack: error?.stack,
            componentStack: info?.componentStack,
            url: window.location.href,
            ua: navigator.userAgent
          })
        }).catch(()=>{});
      } catch(e){}
    }
    render(){
      if(this.state.hasError){
        return React.createElement('div',{
          style:{padding:'30px 16px',background:'#0a0f1e',color:'#f87171',fontFamily:'monospace',minHeight:'100vh',textAlign:'center'}
        },
          React.createElement('h1',{style:{fontSize:'1.5rem',marginBottom:8}},'⚠️ APP CRASH: ' + this.state.errorName),
          React.createElement('div',{style:{background:'rgba(0,0,0,0.5)',padding:'16px',borderRadius:'8px',margin:'16px auto',maxWidth:'90%',textAlign:'left',overflowWrap:'break-word'}},
            React.createElement('p',{style:{color:'#fca5a5',fontWeight:'bold'}},'Message:'),
            React.createElement('pre',{style:{color:'#f87171',whiteSpace:'pre-wrap',fontSize:'0.85rem'}}, this.state.errorMsg),
            React.createElement('p',{style:{color:'#fca5a5',fontWeight:'bold',marginTop:12}},'Stack:'),
            React.createElement('pre',{style:{color:'#94a3b8',whiteSpace:'pre-wrap',fontSize:'0.75rem',maxHeight:'200px',overflow:'auto'}}, this.state.errorStack)
          ),
          React.createElement('p',{style:{color:'#94a3b8',fontSize:'0.85rem'}},'Browser: ' + (navigator.userAgent?.slice(0,60)||'unknown'))
        );
      }
      return this.props.children;
    }
  }
  