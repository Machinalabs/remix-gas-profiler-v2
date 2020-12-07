import React from 'react'
import { useRemix } from '../hooks'

export const WelcomeView = () => {
    const { themeType } = useRemix()

    return (
        <div id='gas-profiler-root'>
            <div className="card">
                <div className="card-body">
                    <h6 className="card-title">Description</h6>
                    <p className="card-text">Profile gas costs for every transaction you execute</p>

                    <h6 className="card-title">How to use?</h6>
                    <p className="card-text">Simply execute a transaction and open the profiler</p>

                    <h6 className="card-title">Limitations</h6>
                    <ul>
                        <li>Tested only with single contracts</li>
                        <li>Gas cost calculation still not 100 % accurate</li>
                    </ul>

                    <h6 className="card-title">Links</h6>
                    <div className="card-title">
                        <a target="_parent" href="https://github.com/EdsonAlcala/remix-gas-profiler/issues"
                            className="card-link">Issues / bug
                        tracker</a>
                        <a target="_parent" href="https://github.com/EdsonAlcala/remix-gas-profiler"
                            className="card-link">Repository</a>
                    </div>

                    <h6 className="card-title">Contact author</h6>
                    <a target="_blank" rel="noopener noreferrer" href="mailto:hello@machinalabs.dev" className="card-link">edson_alcala@msn.com</a>
                </div>
                <div className="card-footer custom text-center">
                    <div className="alert alert-danger" role="alert">
                        WARNING: Debugger plugin is required
                </div>
                </div>
            </div>
        </div>
    )
}