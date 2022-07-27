const rootNode = document.getElementById("app");
const root = ReactDOM.createRoot(rootNode);

function easeOut(x) {
    return 1 - Math.pow(1 - x, 3.5);
}

class ModuleView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            top: Number(this.props.where.split(" ")[0]),
            left: Number(this.props.where.split(" ")[1]),
            topTarget: Number(this.props.where.split(" ")[0]),
            leftTarget: Number(this.props.where.split(" ")[1]),
            mouseDown: false,
            offset: {
                top: 0,
                left: 0,
            },
            bgSizeChangeSpeed: 1,
            bgSize: 0,
        }
    }

    handleMouseDown = (e) => {
        this.props.mouseDown(this.move.bind(this), this.handleMouseUp.bind(this), this.props.name);
        this.setState({
            mouseDown: true,
            offset: {
                top: e.clientY - this.state.top,
                left: e.clientX - this.state.left,
            },
            bgSizeChangeSpeed: -1,
        });
    }

    move = (e) => {
        if (this.state.mouseDown) {
            this.setState({
                topTarget: e.clientY - this.state.offset.top,
                leftTarget: e.clientX - this.state.offset.left,
            });
        }
    }

    handleMouseUp = (e) => {
        this.props.mouseUp(this.props.name);
        this.setState({
            mouseDown: false,
            animationRequested: true,
            bgSizeChangeSpeed: 1,
        });
    }

    render() {
        let easedBGSize = easeOut(this.state.bgSize / 100) * 100;
        const styleBG = {
            top: this.state.top  - 50 + 'px',
            left: this.state.left - 50 + 'px',
            backgroundSize: easedBGSize + '% ' + easedBGSize + '%',
        }

        let updatedState = {};

        if (this.state.bgSizeChangeSpeed !== 0) {
            if (this.state.bgSize + this.state.bgSizeChangeSpeed >= 100 ||
                this.state.bgSize + this.state.bgSizeChangeSpeed <= 0) 
            {
                updatedState.bgSizeChangeSpeed = 0;
                updatedState.bgSize = this.state.bgSize>50? 100 : 0;
            } else {
                updatedState.bgSize = this.state.bgSize + this.state.bgSizeChangeSpeed;
            }
        }

        if (this.state.topTarget !== this.state.top) {
            updatedState.top = this.state.top + (this.state.topTarget - this.state.top) / 15;
        }
        if (this.state.leftTarget !== this.state.left) {
            updatedState.left = this.state.left + (this.state.leftTarget - this.state.left) / 15;
        }

        if (Object.keys(updatedState).length > 0) {
            setTimeout(() => {
                this.setState(updatedState);
            }, 10);
        }

        return (
            <div>
                <div 
                    className="moduleBackground"
                    style={styleBG}
                >
                    <div 
                        className="moduleView"
                        onMouseDown={this.handleMouseDown}
                        onMouseUp={this.handleMouseUp}
                    >
                        <h3>{this.props.name}</h3>
                    </div>
                </div>
            </div>
        );
    }
};

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            modules: [],
            version: '',
            apiAvailable: true,
            onMouseMove: () => {},
            onMouseUp: () => {},
        }
    }

    mouseDown(moveCallback, upCallback, name) {
        this.setState({
            onMouseMove: moveCallback,
            onMouseUp: upCallback,
        });
    }

    mouseUp(name) {
        this.setState({
            onMouseMove: () => {},
            onMouseUp: () => {},
        });
    }

    async componentDidMount() {
        try {
            const version = await (await fetch('/api/version')).text();
            const modules = await (await fetch('/api/ports')).json();
            this.setState({
                modules: modules,
                version: version,
            });
        } catch (e) {
            this.setState({
                apiAvailable: false,
            });
        }
    }

    render() {
        if (!this.state.apiAvailable) {
            return (
                <div>
                    <div className="centered">
                        <h1>Service Unavailable</h1>
                    </div>
                </div>
            );
        }

        if (this.state.version === '') {
            return (
                <div>
                    <div className="centered">
                        <h1>Loading...</h1>
                    </div>
                </div>
            );
        }

        let modules = this.state.modules.map((module, index) => 
            <ModuleView 
                where={`${100*index} ${100*index}`} 
                name={module.usage}
                mouseUp = {this.mouseUp.bind(this)}
                mouseDown = {this.mouseDown.bind(this)}
                mouseMove = {this.state.onMouseMove.bind(this)}
            />
        );
        return (
            <div 
                onMouseMove={(e) => {this.state.onMouseMove(e)}} 
                onMouseUp={(e) => {this.state.onMouseUp(e)}}
                style={{height: '100%'}}
            >
                { modules }

                <div className="centered">
                    <h1>Silver</h1>
                    <h5>v{this.state.version}</h5>
                </div>
            </div>
        );
    }
}

root.render(<App />);