pipeline {
    agent any

    options {
        skipStagesAfterUnstable()
    }

    environment {
        // SNYK
        SNYK_TOKEN = credentials('snyk')
        SNYK_CFG_ORG = 'guaranty-support-inc'


        // https://www.electronjs.org/docs/latest/tutorial/testing-on-headless-ci
        // https://stackoverflow.com/a/40678605
        DISPLAY = '1'

        AZURE_REPOSITORY = 'insolvregistry.azurecr.io'
    }

    stages {
		stage('Setup') {
            steps {
                script {
                    env.GIT_LOCAL_BRANCH = get_git_branch(env.GIT_BRANCH)
                }

                sh './ncigf/build/utils/login-to-azure.sh';
                sh 'az config set defaults.acr=${AZURE_REPOSITORY}'
                sh 'az login --identity'
                sh 'az acr login --name ${AZURE_REPOSITORY}'
            }
        }
        stage('Install') {
            steps {
                script {
                    sh 'npm ci'
                    sh 'npx electron-forge make'
                }
            }
        }
        stage('Test') {
            steps {
                script {
                    sh 'npm test'
                    sh 'npm run wdio'
                }
            }
        }
        stage('Scan') {
            steps {
                script {
                    sh 'snyk auth ${SNYK_TOKEN}'
                    sh 'snyk ignore --file-path=./node_modules'
                    sh 'snyk ignore --file-path=./out'
                    sh 'snyk code test'
                }
            }
        }
        stage('Remote Build') {
            steps {
                script {

                }
            }
        }
    }
    post {
        always {
            script {
                expose_jenkins_properties_to_env()
            }
        }
    }
}

def get_git_branch(String branch) {
    return branch.substring(branch.indexOf('/') + 1)
}

def expose_jenkins_properties_to_env() {
    env.JENKINS_RESULT = currentBuild.result
    env.JENKINS_DURATION = currentBuild.duration
}
