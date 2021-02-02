import React, {Component} from 'react';
import {Container, Row, Col, Form} from 'react-bootstrap';
import './DepositView.css';



class ActionView extends Component {

  constructor(props) {
    // props: tokens list {fakeID, realID, symbol}
    super(props);
  }

  options(){
    var tokenOptions = [];
    var i =0;
    const len = this.props.tokens.length;
    for(i=0; i < len; i++){
      const fakeId = this.props.tokens[i].fakeID;
      const symbol = this.props.tokens[i].symbol;
      tokenOptions.push(<option value={fakeId}>{symbol}</option>);
    }
    return tokenOptions;
  }

  render() {
    const options = this.options();
    console.log("These are the options");
    console.log(options);
    if(this.props.type == "Collateral"){
      return (
        <div className="container">
        <div>
        <Container>
          <Row>
          <h4>Add Collateral from wallet</h4>
          </Row>

          <Row>
            <Form className="inputField">
              <Form.Group controlId="formBasicEmail" className="topValueInput">
                <Form.Control size="sm" type="email" placeholder="e.g 450" className="valueInput"/>
              </Form.Group>

              <Form.Group controlId="exampleForm.ControlSelect1" className="topTokenInput">
                <Form.Control size="sm" as="select" className="tokenInput">
                  {options}
                </Form.Control>
              </Form.Group>
            </Form>
          </Row>

          <Row>
            <Form className="inputField">
              <Form.Group controlId="formBasicEmail" className="topValueInput">
                <Form.Control size="sm" type="email" placeholder="1000" className="valueInput"/>
              </Form.Group>

            <Form.Group className="topTokenInput">
              <Form.Control size="sm" className="tokenInput" placeholder="USD" disabled />
            </Form.Group>
            </Form>
          </Row>

          <Row>
            <button type="button" className="collateral-submit">Submit Transaction</button>
          </Row>

        </Container>
        </div>

        <hr/>

        <div>
        <Container>
          <Row>
          <h4>Add Collateral from deposit</h4>
          </Row>

          <Row>
            <Form className="inputField">
              <Form.Group controlId="formBasicEmail" className="topValueInput">
                <Form.Control size="sm" type="email" placeholder="e.g 450" className="valueInput"/>
              </Form.Group>

              <Form.Group controlId="exampleForm.ControlSelect1" className="topTokenInput">
                <Form.Control size="sm" as="select" className="tokenInput">
                  {options}
                </Form.Control>
              </Form.Group>
            </Form>
          </Row>

          <Row>
            <Form className="inputField">
              <Form.Group controlId="formBasicEmail" className="topValueInput">
                <Form.Control size="sm" type="email" placeholder="1000" className="valueInput"/>
              </Form.Group>

            <Form.Group className="topTokenInput">
              <Form.Control size="sm" className="tokenInput" placeholder="USD" disabled />
            </Form.Group>
            </Form>
          </Row>

          <Row>
            <button type="button" className="collateral-submit">Submit Transaction</button>
          </Row>

        </Container>
        </div>
        </div>
      );
    }else{
      return (
        <div className="container">

        <div>
        <Container>
          <Row>
          <div><br/></div>
          </Row>
          <Row>
          <h3>{this.props.type}</h3>
          </Row>
          <br/>

          <Row>
            <Form className="inputField">
              <Form.Group controlId="formBasicEmail" className="topValueInput">
                <Form.Control size="lg" type="email" placeholder="e.g 450" className="valueInput"/>
              </Form.Group>

              <Form.Group controlId="exampleForm.ControlSelect1" className="topTokenInput">
                <Form.Control size="lg" as="select" className="tokenInput">
                  <option>1</option>
                  <option>2</option>
                  <option>3</option>
                  <option>4</option>
                  <option>5</option>
                </Form.Control>
              </Form.Group>
            </Form>
          </Row>

          <Row>
            <Form className="inputField">
            <Form.Group controlId="formBasicEmail" className="topValueInput">
              <Form.Control size="lg" type="email" placeholder="1000" className="valueInput"/>
            </Form.Group>

            <Form.Group className="topTokenInput">
              <Form.Control size="lg" className="tokenInput" placeholder="USD" disabled />
            </Form.Group>
            </Form>
          </Row>

          <Row>
            <button type="button" className="submitButton">Submit Transaction</button>

          </Row>

        </Container>
        </div>

        </div>
      );
    }

  }
}
export default ActionView;
