import React, {Component} from 'react';
import './Balance.css';
import PriceUpdate from './price_update';
import Web3 from 'web3';
import {Container, Row, Col, Navbar} from 'react-bootstrap';
import logo from './logo.png';
import {IRVAR_ABI, IRVAR_ADD,LiquidityPool_ABI, LiquidityPool_ADD, Exchange_ADD, Exchange_ABI, ERC20_ABI, Token_ABI, Token_BYTECODE } from './abis/abi'
import {loadWeb3, getAccount, getUserDeposit, getUserLoanDetails, getTokenAPIPrice} from './utils.js';


class Balance extends Component {

  constructor(props) {
    // props fakeID token
    super(props);
    this.state = {
      isLoaded: false,
      liquidityPool: null,
      web3: null,
      reloadedBalance: false,
      totalborrowed: 0,
      totalDeposited: 0,
      utilisation: 0,
      totalCollateral: 0,
      reserves: 0,
    };
  }

  componentWillMount(){
    this.loadBlockchainData();
  }


  async loadBlockchainData(){
    const web3 = await loadWeb3();
    const account = await getAccount(web3);
    //initialise instance of LP contract
    const lpinstance = new web3.eth.Contract(LiquidityPool_ABI, LiquidityPool_ADD);
    this.setState({liquidityPool: lpinstance,web3: web3});
    await this.renderLiquidity(web3);
    this.setState({isLoaded: true});
  }

  async renderLiquidity(web3, lpinstance){
    const tokenAdd = await web3.utils.toChecksumAddress(fakeID);
    // reserves
    const tokenInstance = new web3.eth.Contract(ERC20_ABI, tokenAdd);
    const reserves = await tokenInstance.methods.balanceOf(LiquidityPool_ADD).call();
    // total deposited
    const tokensdata = await this.state.liquidityPool.methods.tokensData(tokenAdd).call();
    this.setState({reserves: reserves, totalDeposited: tokensdata.totalDeposited, totalBorrowed: tokensdata.totalBorrowed, totalCollateral: tokensdata.totalCollateral});
    console.log("Finished loading");
  }

  render() {

      return (
        <div className="container">

        <Container className="container">
          <Row className="rows">
          deposited
          </Row>
          <Row className="rows">
          borrowed
          </Row>
          <Row className="rows">
          collateral
          </Row>
          <Row className="rows">
          reserves
          </Row>
        </Container>

        </div>
      );
    }else{
      return(<div>Loading</div>);
    }

  }
}
export default Balance;
