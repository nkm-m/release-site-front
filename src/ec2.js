module.exports = class EC2 {
  constructor(AWS, credentials) {
    this.ec2 = new AWS.EC2(credentials);
  }
  /**
   * AMI一覧を取得するメソッド
   */
  async listImages() {
    const params = {
      Filters: [
        {
          Name: "is-public",
          Values: [
            "false"
            /* more items */
          ]
        }
        /* more items */
      ]
    };

    try {
      const result = await this.ec2.describeImages(params).promise();
      return result.Images;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  /**
   * アカウント内のインスタンスIDを取得するメソッド
   */
  async describeInstances() {
    try {
      const result = await this.ec2.describeInstances().promise();
      return result;
    } catch (err) {
      console.log("describeInstancesでエラーが発生しました。");
      throw err;
    }
  }

  /**
   * マスターインスタンスIDを取得するメソッド
   */
  async describeMasterInstance(instanceName) {
    const params = {
      Filters: [
        {
          Name: "tag:Name",
          Values: [instanceName]
        }
      ]
    };

    try {
      const result = await this.ec2.describeInstances(params).promise();
      return result.Reservations[0].Instances[0].InstanceId;
    } catch (err) {
      console.log("describeMasterInstanceでエラーが発生しました。");
      throw err;
    }
  }

  /**
   * AMIを作成するメソッド
   */
  async createImage(InstanceId, Name) {
    const params = {
      InstanceId /* required */,
      Name /* required */,
      BlockDeviceMappings: [
        {
          DeviceName: "/dev/sda1",
          Ebs: {
            DeleteOnTermination: true,
            Encrypted: false,
            //Iops: 'NUMBER_VALUE',
            //KmsKeyId: 'STRING_VALUE',
            //SnapshotId: 'STRING_VALUE',
            //Throughput: 'NUMBER_VALUE',
            VolumeSize: 30,
            VolumeType: "gp2"
          }
          //NoDevice: 'STRING_VALUE',
          //VirtualName: 'STRING_VALUE'
        }
        /* more items */
      ],
      Description: Name,
      DryRun: false,
      NoReboot: true
    };

    try {
      const result = await this.ec2.createImage(params).promise();
      return result.ImageId;
    } catch (err) {
      console.log("createImageでエラーが発生しました。");
      throw err;
    }
  }

  /**
   * 作成したAMI情報を取得するメソッド
   * スナップショットIDが生成されたらreturn
   */
  async describeImages(imageId) {
    const params = {
      ImageIds: [imageId]
    };

    let result = await this.ec2.describeImages(params).promise();
    if ("SnapshotId" in result.Images[0].BlockDeviceMappings[0].Ebs) {
      return result.Images[0];
    }
    while (!("SnapshotId" in result.Images[0].BlockDeviceMappings[0].Ebs)) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      try {
        result = await this.ec2.describeImages(params).promise();
        if ("SnapshotId" in result.Images[0].BlockDeviceMappings[0].Ebs) {
          return result.Images[0];
        }
      } catch (err) {
        console.log("describeImagesでエラーが発生しました。");
        throw err;
      }
    }
  }

  /**
   * AMIとスナップショットにタグ付けするメソッド
   */
  async createTags(imageId, snapshotId, imageName) {
    const params = {
      Resources: [imageId, snapshotId],
      Tags: [
        {
          Key: "Name",
          Value: imageName
        }
      ]
    };

    try {
      await this.ec2.createTags(params).promise();
    } catch (err) {
      console.log("createTagsでエラーが発生しました。");
      throw err;
    }
  }

  /**
   * AMIを削除するメソッド
   */
  async deregisterImage(ImageId) {
    const params = {
      ImageId /* required */,
      DryRun: false
    };
    try {
      await this.ec2.deregisterImage(params).promise();
    } catch (err) {
      console.log("deregisterImageでエラーが発生しました。");
      throw err;
    }
  }

  /**
   * スナップショットを削除するメソッド
   */
  async deleteSnapshot(SnapshotId) {
    const params = {
      SnapshotId /* required */,
      DryRun: false
    };
    try {
      await this.ec2.deleteSnapshot(params).promise();
    } catch (err) {
      console.log("deleteSnapshotでエラーが発生しました。");
      throw err;
    }
  }
};
