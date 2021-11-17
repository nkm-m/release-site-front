module.exports = class CloudFormation {
  constructor(AWS, credentials) {
    this.cloudformation = new AWS.CloudFormation(credentials);
  }

  /**
   * 変更セットを作成するメソッド
   */
  async createChangeSet(StackName, imageId) {
    const params = {
      ChangeSetName: `ChangeSet-${new Date().getTime()}` /* required */,
      StackName /* required */,
      // Capabilities: [
      //   CAPABILITY_IAM | CAPABILITY_NAMED_IAM | CAPABILITY_AUTO_EXPAND,
      //   /* more items */
      // ],
      // ChangeSetType: CREATE | UPDATE | IMPORT,
      // ClientToken: 'STRING_VALUE',
      // Description: 'STRING_VALUE',
      // IncludeNestedStacks: true || false,
      // NotificationARNs: [
      //   'STRING_VALUE',
      //   /* more items */
      // ],
      Parameters: [
        {
          ParameterKey: "Ec2ImageId",
          ParameterValue: imageId
          // ResolvedValue: 'STRING_VALUE',
          // UsePreviousValue: true || false,
        }
        /* more items */
      ],
      // ResourceTypes: [
      //   'STRING_VALUE',
      //   /* more items */
      // ],
      // ResourcesToImport: [
      //   {
      //     LogicalResourceId: 'STRING_VALUE' /* required */,
      //     ResourceIdentifier: {
      //       /* required */
      //       '<ResourceIdentifierPropertyKey>': 'STRING_VALUE',
      //       /* '<ResourceIdentifierPropertyKey>': ... */
      //     },
      //     ResourceType: 'STRING_VALUE' /* required */,
      //   },
      //   /* more items */
      // ],
      // RoleARN: 'STRING_VALUE',
      // RollbackConfiguration: {
      //   MonitoringTimeInMinutes: 'NUMBER_VALUE',
      //   RollbackTriggers: [
      //     {
      //       Arn: 'STRING_VALUE' /* required */,
      //       Type: 'STRING_VALUE' /* required */,
      //     },
      //     /* more items */
      //   ],
      // },
      // Tags: [
      //   {
      //     Key: 'STRING_VALUE' /* required */,
      //     Value: 'STRING_VALUE' /* required */,
      //   },
      //   /* more items */
      // ],
      // TemplateBody: 'STRING_VALUE',
      // TemplateURL: 'STRING_VALUE',
      UsePreviousTemplate: true
    };

    try {
      const result = await this.cloudformation
        .createChangeSet(params)
        .promise();
      return result;
    } catch (err) {
      console.log("createChangeSetでエラーが発生しました。");
      throw err;
    }
  }

  /**
   * 変更セットの作成が完了したら変更セットの詳細を返すメソッド
   */
  async describeChangeSet(ChangeSetName) {
    const params = {
      ChangeSetName /* required */,
      //NextToken: 'STRING_VALUE',
      StackName: this.$stackName
    };
    try {
      let changeSet = await this.cloudformation
        .describeChangeSet(params)
        .promise();
      if (changeSet.Status === "CREATE_COMPLETE") {
        return changeSet;
      }
      while (changeSet.Status !== "CREATE_COMPLETE") {
        await new Promise(resolve => setTimeout(resolve, 3000));
        changeSet = await this.cloudformation
          .describeChangeSet(params)
          .promise();
        if (changeSet.Status === "CREATE_COMPLETE") {
          return changeSet;
        } else if (changeSet.Status === "FAILED") {
          return changeSet.Status;
        }
      }
    } catch (err) {
      console.log("describeChangeSetでエラーが発生しました。");
      throw err;
    }
  }

  /**
   * スタックドリフトを検出するメソッド
   */
  async detectStackDrift(StackName) {
    const params = {
      StackName /* required */
      // LogicalResourceIds: [
      //   'STRING_VALUE',
      //   /* more items */
      // ],
    };
    try {
      const result = await this.cloudformation
        .detectStackDrift(params)
        .promise();
      return result;
    } catch (err) {
      console.log("detectStackDriftでエラーが発生しました。");
      throw err;
    }
  }

  /**
   * ドリフトの検出結果を取得するメソッド
   */
  async describeStackDriftDetectionStatus(StackDriftDetectionId) {
    const params = {
      StackDriftDetectionId /* required */
    };

    try {
      let result = await this.cloudformation
        .describeStackDriftDetectionStatus(params)
        .promise();
      if (result.DetectionStatus === "DETECTION_COMPLETE") {
        return result.StackDriftStatus;
      }
      while (result.DetectionStatus !== "DETECTION_COMPLETE") {
        await new Promise(resolve => setTimeout(resolve, 3000));
        result = await this.cloudformation
          .describeStackDriftDetectionStatus(params)
          .promise();
      }
      if (result.DetectionStatus === "DETECTION_COMPLETE") {
        return result.StackDriftStatus;
      } else if (result.DetectionStatus === "DETECTION_FAILED") {
        return result.DetectionStatus;
      }
    } catch (err) {
      console.log("describeStackDriftDetectionStatusでエラーが発生しました。");
      throw err;
    }
  }

  /**
   * 変更セット一覧を取得するメソッド
   */
  async listChangeSets(StackName) {
    const params = {
      StackName /* required */
      //NextToken: 'STRING_VALUE',
    };
    try {
      const result = await this.cloudformation.listChangeSets(params).promise();
      return result;
    } catch (err) {
      console.log("listChangeSetsでエラーが発生しました。");
      throw err;
    }
  }

  /**
   * 変更セットを実行するメソッド
   */
  async executeChangeSet(ChangeSetName, StackName) {
    const params = {
      ChangeSetName /* required */,
      //ClientRequestToken: 'STRING_VALUE',
      StackName
    };
    try {
      await this.cloudformation.executeChangeSet(params).promise();
    } catch (err) {
      console.log("executeChangeSetでエラーが発生しました。");
      throw err;
    }
  }

  /**
   * CloudFormationスタックを直接更新するメソッド
   */
  async updateStack(StackName, imageId) {
    const params = {
      StackName /* required */,
      // Capabilities: [
      //   CAPABILITY_IAM | CAPABILITY_NAMED_IAM | CAPABILITY_AUTO_EXPAND,
      //   /* more items */
      // ],
      //ClientRequestToken: 'STRING_VALUE',
      // NotificationARNs: [
      //   process.env.SnsArn,
      //   /* more items */
      // ],
      Parameters: [
        {
          ParameterKey: "Ec2ImageId",
          ParameterValue: imageId
          // ResolvedValue: 'STRING_VALUE',
          // UsePreviousValue: true || false,
        }
        /* more items */
      ],
      // ResourceTypes: [
      //   'STRING_VALUE',
      //   /* more items */
      // ],
      // RoleARN: 'STRING_VALUE',
      // RollbackConfiguration: {
      //   MonitoringTimeInMinutes: 'NUMBER_VALUE',
      //   RollbackTriggers: [
      //     {
      //       Arn: 'STRING_VALUE' /* required */,
      //       Type: 'STRING_VALUE' /* required */,
      //     },
      //     /* more items */
      //   ],
      // },
      // StackPolicyBody: 'STRING_VALUE',
      // StackPolicyDuringUpdateBody: 'STRING_VALUE',
      // StackPolicyDuringUpdateURL: 'STRING_VALUE',
      // StackPolicyURL: 'STRING_VALUE',
      Tags: [
        {
          Key: "Created by" /* required */,
          Value: "ReleaseSite" /* required */
        }
        /* more items */
      ],
      // TemplateBody: 'STRING_VALUE',
      // TemplateURL: 'STRING_VALUE',
      UsePreviousTemplate: true
    };

    try {
      await this.cloudformation.updateStack(params).promise();
    } catch (err) {
      console.log("updateStackでエラーが発生しました。");
      throw err;
    }
  }

  /**
   * CloudFormationスタックの更新状況を取得するメソッド
   */
  async describeStackEvents(StackName) {
    const params = {
      //NextToken: 'STRING_VALUE',
      StackName
    };

    try {
      let result = await this.cloudformation
        .describeStackEvents(params)
        .promise();
      if (result.StackEvents.length !== 0) {
        let latestEvent = `${result.StackEvents[0].LogicalResourceId}:${result.StackEvents[0].ResourceStatus}`;
        if (latestEvent === `${StackName}:UPDATE_COMPLETE`) {
          return true;
        }
        while (latestEvent !== `${StackName}:UPDATE_COMPLETE`) {
          await new Promise(resultolve => setTimeout(resultolve, 30000));
          result = await this.cloudformation
            .describeStackEvents(params)
            .promise();
          latestEvent = `${result.StackEvents[0].LogicalResourceId}:${result.StackEvents[0].ResourceStatus}`;
          if (latestEvent === `${StackName}:UPDATE_COMPLETE`) {
            return true;
          } else if (
            latestEvent.includes("FAILED") ||
            latestEvent.includes("ROLLBACK")
          ) {
            return false;
          }
        }
      }
    } catch (err) {
      console.log(err);
      this.changeState("error", err, "#ff0000");
    }
  }

  /**
   * CloudFormationスタックの更新イベントを取得するメソッド
   * @param {String} StackName
   * @returns StackEvents
   */
  async listStackEvents(StackName) {
    const params = {
      //NextToken: 'STRING_VALUE',
      StackName
    };
    try {
      const result = await this.cloudformation
        .describeStackEvents(params)
        .promise();
      return result.StackEvents;
    } catch (err) {
      console.log("listStackEventsでエラーが発生しました。");
    }
  }
};
