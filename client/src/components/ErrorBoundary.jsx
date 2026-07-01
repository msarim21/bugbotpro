import React from 'react';

  export default class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }
    componentDidCatch(error, info) {
      console.error('React Error:', error, info);
    }
    render() {
      if (this.state.hasError) {
        return (
          <div style={{background:'#0a0f1e',color:'#f87171',padding:40,minHeight:'100vh',fontFamily:'monospace'}}>
            <h1>⚠️ App Crash</h1>
            <pre style={{whiteSpace:'pre-wrap',background:'rgba(0,0,0,0.5)',padding:20,borderRadius:8}}>
              {this.state.error?.toString?.() || 'Unknown error'}
            </pre>
            <p style={{color:'#94a3b8'}}>Browser console check karo (F12 → Console)</p>
          </div>
        );
      }
      return this.props.children;
    }
  }
  