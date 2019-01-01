
const viterbiFactory = (hmm, obSequence) => ({
	initViterbi : () => {
		let initTrellis = [];
        let obIndex = hmm.observables.indexOf(obSequence[0]);
        let obEmission = hmm.emissionMatrix[obIndex];  
        hmm.initialProb.forEach((p,i) => {
            initTrellis.push(p*obEmission[i]);
        });

        return initTrellis;
	},
	recViterbi : function(prevTrellis, obIndex, psiArrays, trellisSequence)  {

        if (obIndex === obSequence.length) return {psiArrays, trellisSequence};  

        let nextTrellis = hmm.states.map((state,stateIndex) => {
            let trellisArr = prevTrellis.map((prob,i) => {
                let trans = hmm.transMatrix[i][stateIndex];
                let emiss = hmm.emissionMatrix[hmm.observables.indexOf(obSequence[obIndex])][stateIndex];
                return prob*trans*emiss;
            })
            let maximized = Math.max(...trellisArr);   
            psiArrays[stateIndex].push(trellisArr.indexOf(maximized));   
            return maximized;

        }, []);

        trellisSequence.push(nextTrellis);
        return  this.recViterbi(nextTrellis, obIndex+1, psiArrays, trellisSequence);
        
        /* let nextTrellis = [];
        for (let s = 0; s < hmm.states.length; s++) {
            let trellisArr = [];
            prevTrellis.forEach((prob, i) => {
                let trans = hmm.transMatrix[i][s];
                let emiss = hmm.emissionMatrix[hmm.observables.indexOf(obSequence[obIndex])][s];
                trellisArr.push(prob*trans*emiss);
            });      
            let maximized = Math.max(...trellisArr);      
            nextTrellis.push(maximized);
            psiArrays[s].push(trellisArr.indexOf(maximized));            
        }; */

    },
	termViterbi : (recTrellisPsi) => {
        let finalTrellis = recTrellisPsi.trellisSequence[recTrellisPsi.trellisSequence.length-1]
        let maximizedProbability = Math.max(...finalTrellis);
        recTrellisPsi.psiArrays.forEach(psiArr => {
            psiArr.push(finalTrellis.indexOf(maximizedProbability)); 
        });        
        return {maximizedProbability, psiArrays:recTrellisPsi.psiArrays};     
    },
	backViterbi : (psiArrays) => {
        let backtraceObj = obSequence.reduce(( acc, currS, i) => {  
            if (acc.length === 0) {                
                let finalPsiIndex = psiArrays[0].length-1;
                let finalPsi = psiArrays[0][finalPsiIndex];
                acc.push({psi:finalPsi, index:finalPsiIndex});
                return acc;
            }                
            let prevPsi = acc[acc.length-1];
            let psi = psiArrays[prevPsi.psi][prevPsi.index-1];
            acc.push({psi, index:prevPsi.index-1});
            return acc;
        },[])
        return backtraceObj.reverse().map(e => hmm.states[e.psi]);       
    }
});


const Viterbi = (hmm) => ({
    viterbiAlgorithm : function(obSequence) {    	
        let viterbi = viterbiFactory(hmm, obSequence);
        let initTrellis = viterbi.initViterbi();
        let psiArrays = hmm.states.map(s => [null]); // Initialization of psi arrays is equal to 0, but I use null because 0 could later represent a state index
        let recTrellisPsi = viterbi.recViterbi(initTrellis, 1, psiArrays, [initTrellis]);
        let pTerm = viterbi.termViterbi(recTrellisPsi);
        let backtrace = viterbi.backViterbi(pTerm.psiArrays);       
        return {stateSequence:backtrace, trellisSequence:recTrellisPsi.trellisSequence, terminationProbability:pTerm.maximizedProbability};
    }    
});



const HMM = (states, observables, init) => {
    let hmm = {  
        states: states.map(s => s.state),        
        transMatrix : states.map(s => s.prob),  
        initialProb : init,   
        observables : observables.map( o => o.obs ),
        emissionMatrix : observables.map(o => o.prob)     
    }     
    return Object.assign({}, hmm,  Viterbi(hmm))
};

let hiddenStates = [    
    {state: 'Sunny', prob: [0.8, 0.2]},    
    {state: 'Rainy', prob: [0.4, 0.6]}     
];

let observables = [    
    {obs: 'Paint', prob: [0.4, 0.3]},    
    {obs: 'Clean', prob: [0.1, 0.45]},    
    {obs: 'Shop', prob: [0.2, 0.2]},    
    {obs: 'Bike', prob: [0.3, 0.05]}    
];

let hiddenInit = [0.6, 0.4];

let LeaHMModel = HMM(hiddenStates, observables, hiddenInit);

let obSequence = ['Shop','Clean','Bike','Paint']; 
console.log(LeaHMModel.viterbiAlgorithm(obSequence));

