import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props){
    super(props)
    this.state = { hasError: false, error: null, info: null }
  }

  static getDerivedStateFromError(error){
    return { hasError: true, error }
  }

  componentDidCatch(error, info){
    this.setState({ error, info })
    // optionally send to logging endpoint
    if (typeof window !== 'undefined' && window.console) console.error('Captured error in ErrorBoundary', error, info)
  }

  render(){
    if (this.state.hasError){
      return (
        <div style={{ padding:20 }}>
          <h2>Se produjo un error en la aplicación</h2>
          <div style={{ whiteSpace:'pre-wrap', background:'#fff6f6', padding:12, border:'1px solid #f5c6cb', borderRadius:6, color:'#721c24' }}>
            <strong>{String(this.state.error && this.state.error.toString())}</strong>
            <div style={{ marginTop:8 }}>{this.state.info && this.state.info.componentStack}</div>
          </div>
          <div style={{ marginTop:12 }}>
            <button className="btn" onClick={()=> window.location.reload()}>Recargar</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
